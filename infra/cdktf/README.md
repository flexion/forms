# @flexion/forms-infra

Infrastructure-as-code (IaC) for the project, implemented with [Terraform CDK](https://github.com/hashicorp/terraform-cdk).

## Deployment steps

To prepare for deployment, first build the project:

```bash
pnpm build
```

To perform a deployment, ensure the current environment is configured with credentials for AWS and Cloud.gov (see below for details). Then, you may deploy with:

```bash
pnpm deploy
```

## Deployment environments

This project supports multiple deployment targets organized by platform:

### Cloud.gov
- `cloud-gov-main`: Production deployment to Cloud.gov
- `cloud-gov-demo`: Demo deployment to Cloud.gov

### AWS
- `aws-main`: Production deployment to AWS (App Runner + RDS)
- `aws-demo`: Demo deployment to AWS (App Runner + RDS)

## Cloud services

### AWS

The Terraform state is maintained in an AWS S3 bucket. AWS deployments use:
- **App Runner** for the containerized application
- **RDS PostgreSQL** for the database
- **VPC** with public subnets
- **Secrets Manager** for database credentials
- **ECR** for container images

To deploy to AWS, you must have appropriate AWS credentials configured:

```bash
export AWS_ACCESS_KEY_ID=<your-access-key>
export AWS_SECRET_ACCESS_KEY=<your-secret-key>
export AWS_DEFAULT_REGION=us-east-2
```

#### Deploying to AWS

Before deploying, ensure the Docker image is built and pushed to ECR:

```bash
# Build the sandbox app Docker image
docker build --build-arg APP_DIR=sandbox -t sandbox:latest -f Dockerfile .

# Tag and push to ECR (replace <account-id> and <env> with your values)
# For demo: flexion-forms-demo
# For main: flexion-forms-main
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-2.amazonaws.com
docker tag sandbox:latest <account-id>.dkr.ecr.us-east-2.amazonaws.com/flexion-forms-<env>:latest
docker push <account-id>.dkr.ecr.us-east-2.amazonaws.com/flexion-forms-<env>:latest
```

Then deploy the infrastructure:

```bash
# Deploy to demo
pnpm deploy:aws-demo

# Deploy to main/production
pnpm deploy:aws-main
```

### Cloud.gov

The project team intends to default to deploying infrastructure to Cloud.gov. The

Interacting with cloud.gov requires login via the Cloudfoundry CLI:

```bash
cf login -a api.fr.cloud.gov --sso
```

cloud.gov operations may be bootstrapped with `./scripts/cloud.sh`.

```bash
./scripts/cloud.sh -h
```

To initialize a deployment space and create a service account for deployments:

```bash
./scripts/cloud.sh setup -o <organization-name> -s <space-name>
```

To view the credentials:

```bash
./scripts/cloud.sh show -o <organization-name> -s <space-name>
```

To export the deploy user's credentials to your environment:

```bash
source ./scripts/cloud.sh export -o <organization-name> -s <space-name>
```

Once the credentials are exported to the environment, you may utilize them via the Terraform CDK project.
