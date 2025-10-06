import { Construct } from 'constructs';
import { Fn } from 'cdktf';

import { Vpc } from '../../../.gen/providers/aws/vpc';
import { Subnet } from '../../../.gen/providers/aws/subnet';
import { InternetGateway } from '../../../.gen/providers/aws/internet-gateway';
import { RouteTable } from '../../../.gen/providers/aws/route-table';
import { RouteTableAssociation } from '../../../.gen/providers/aws/route-table-association';
import { Route } from '../../../.gen/providers/aws/route';
import { SecurityGroup } from '../../../.gen/providers/aws/security-group';
import { DbSubnetGroup } from '../../../.gen/providers/aws/db-subnet-group';
import { DbInstance } from '../../../.gen/providers/aws/db-instance';
import { SecretsmanagerSecret } from '../../../.gen/providers/aws/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '../../../.gen/providers/aws/secretsmanager-secret-version';
import { EcrRepository } from '../../../.gen/providers/aws/ecr-repository';
import { ApprunnerVpcConnector } from '../../../.gen/providers/aws/apprunner-vpc-connector';
import { ApprunnerService } from '../../../.gen/providers/aws/apprunner-service';
import { IamRole } from '../../../.gen/providers/aws/iam-role';
import { IamRolePolicy } from '../../../.gen/providers/aws/iam-role-policy';
import { IamRolePolicyAttachment } from '../../../.gen/providers/aws/iam-role-policy-attachment';
import { DataAwsAvailabilityZones } from '../../../.gen/providers/aws/data-aws-availability-zones';

import { getDatabaseSecretKey } from '@flexion/forms-infra-core';

interface SandboxStackConfig {
  environment: string;
}

export class SandboxStack extends Construct {
  constructor(scope: Construct, id: string, config: SandboxStackConfig) {
    super(scope, id);

    const { environment } = config;

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, `${id}-azs`, {
      state: 'available',
    });

    // VPC
    const vpc = new Vpc(this, `${id}-vpc`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
        Environment: environment,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, `${id}-igw`, {
      vpcId: vpc.id,
      tags: {
        Name: `${id}-igw`,
        Environment: environment,
      },
    });

    // Public Subnets (for App Runner VPC connector and NAT)
    const publicSubnet1 = new Subnet(this, `${id}-public-subnet-1`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: Fn.element(azs.names, 0),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${id}-public-subnet-1`,
        Environment: environment,
      },
    });

    const publicSubnet2 = new Subnet(this, `${id}-public-subnet-2`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: Fn.element(azs.names, 1),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${id}-public-subnet-2`,
        Environment: environment,
      },
    });

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, `${id}-public-rt`, {
      vpcId: vpc.id,
      tags: {
        Name: `${id}-public-rt`,
        Environment: environment,
      },
    });

    new Route(this, `${id}-public-route`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, `${id}-public-rta-1`, {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, `${id}-public-rta-2`, {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Groups
    const appRunnerSecurityGroup = new SecurityGroup(
      this,
      `${id}-apprunner-sg`,
      {
        name: `${id}-apprunner-sg`,
        description: 'Security group for App Runner service',
        vpcId: vpc.id,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `${id}-apprunner-sg`,
          Environment: environment,
        },
      }
    );

    const rdsSecurityGroup = new SecurityGroup(this, `${id}-rds-sg`, {
      name: `${id}-rds-sg`,
      description: 'Allow postgres access from App Runner',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [appRunnerSecurityGroup.id],
          cidrBlocks: [],
          ipv6CidrBlocks: [],
          prefixListIds: [],
          description: 'Allow postgres access from App Runner',
        },
      ],
      tags: {
        Name: `${id}-rds-sg`,
        Environment: environment,
      },
    });

    // Generate random password for database
    const dbUsername = 'postgres';
    const dbPassword = Fn.base64encode(
      Fn.uuid() // Use UUID for a secure random password
    );

    // Database secret (only username and password - host/port/db passed as env vars)
    const dbSecret = new SecretsmanagerSecret(this, `${id}-db-secret`, {
      name: getDatabaseSecretKey(environment),
      description: `Database credentials for ${environment}`,
      tags: {
        Environment: environment,
      },
    });

    new SecretsmanagerSecretVersion(this, `${id}-db-secret-version`, {
      secretId: dbSecret.id,
      secretString: Fn.jsonencode({
        username: dbUsername,
        password: dbPassword,
      }),
    });

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, `${id}-db-subnet-group`, {
      name: `${id}-db-subnet-group`,
      subnetIds: [publicSubnet1.id, publicSubnet2.id],
      tags: {
        Name: `${id}-db-subnet-group`,
        Environment: environment,
      },
    });

    // RDS Instance
    const rdsInstance = new DbInstance(this, `${id}-db`, {
      identifier: `${id}-db`,
      engine: 'postgres',
      engineVersion: '15',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      dbName: 'postgres',
      username: dbUsername,
      password: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      tags: {
        Name: `${id}-db`,
        Environment: environment,
      },
    });

    // ECR Repository
    const ecrRepo = new EcrRepository(this, `${id}-ecr`, {
      name: `${id}`,
      imageTagMutability: 'MUTABLE',
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      tags: {
        Environment: environment,
      },
    });

    // IAM Role for App Runner instance
    const appRunnerInstanceRole = new IamRole(
      this,
      `${id}-apprunner-instance-role`,
      {
        name: `${id}-apprunner-instance-role`,
        assumeRolePolicy: Fn.jsonencode({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'tasks.apprunner.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Environment: environment,
        },
      }
    );

    // Attach policy to read secrets
    new IamRolePolicyAttachment(
      this,
      `${id}-apprunner-secrets-policy`,
      {
        role: appRunnerInstanceRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/SecretsManagerReadWrite',
      }
    );

    // Attach inline policy for Bedrock model invocation
    new IamRolePolicy(this, `${id}-apprunner-bedrock-policy`, {
      name: `${id}-bedrock-invoke`,
      role: appRunnerInstanceRole.name,
      policy: Fn.jsonencode({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'bedrock:InvokeModel',
              'bedrock:InvokeModelWithResponseStream',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // IAM Role for App Runner access to ECR
    const appRunnerAccessRole = new IamRole(
      this,
      `${id}-apprunner-access-role`,
      {
        name: `${id}-apprunner-access-role`,
        assumeRolePolicy: Fn.jsonencode({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'build.apprunner.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Environment: environment,
        },
      }
    );

    // Attach ECR read policy
    new IamRolePolicyAttachment(
      this,
      `${id}-apprunner-ecr-policy`,
      {
        role: appRunnerAccessRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess',
      }
    );

    // App Runner VPC Connector
    const vpcConnector = new ApprunnerVpcConnector(
      this,
      `${id}-vpc-connector`,
      {
        vpcConnectorName: `${id}-vpc-connector`,
        subnets: [publicSubnet1.id, publicSubnet2.id],
        securityGroups: [appRunnerSecurityGroup.id],
        tags: {
          Name: `${id}-vpc-connector`,
          Environment: environment,
        },
      }
    );

    // App Runner Service
    new ApprunnerService(this, `${id}-apprunner-service`, {
      serviceName: `${id}`,
      sourceConfiguration: {
        autoDeploymentsEnabled: true,
        authenticationConfiguration: {
          accessRoleArn: appRunnerAccessRole.arn,
        },
        imageRepository: {
          imageIdentifier: `${ecrRepo.repositoryUrl}:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '4321',
            runtimeEnvironmentVariables: {
              DB_HOST: rdsInstance.address,
              DB_PORT: '5432',
              DB_NAME: 'postgres',
            },
            runtimeEnvironmentSecrets: {
              DB_SECRET_ARN: dbSecret.arn,
            },
          },
        },
      },
      instanceConfiguration: {
        instanceRoleArn: appRunnerInstanceRole.arn,
        cpu: '1024',
        memory: '2048',
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/',
        interval: 10,
        timeout: 10,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.arn,
        },
      },
      tags: {
        Name: `${id}-apprunner-service`,
        Environment: environment,
      },
    });
  }
}
