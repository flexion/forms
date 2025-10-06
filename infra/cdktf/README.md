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
export AWS_DEFAULT_REGION=us-east-1
```

#### Deploying to AWS

**Deployment Order:**

1. **First: Deploy infrastructure** (creates ECR repositories, VPC, RDS, App Runner service)
2. **Second: Push Docker image** to ECR
3. **Auto-deploy: App Runner** detects new image and redeploys automatically

##### Initial Infrastructure Deployment

```bash
# Deploy infrastructure for demo environment
pnpm deploy:flexion-sandbox-demo

# Deploy infrastructure for main/production environment
pnpm deploy:flexion-sandbox-main
```

This creates:
- ECR repository (`flexion-forms-sandbox-demo` or `flexion-forms-sandbox-main`)
- VPC with subnets and security groups
- RDS PostgreSQL database
- App Runner service (will fail to start until image is pushed)

##### Manual Image Push

After infrastructure is deployed, push your first image:

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Build the sandbox app Docker image
docker build --build-arg APP_DIR=sandbox -t sandbox:latest -f Dockerfile .

# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# For demo environment:
docker tag sandbox:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/flexion-forms-sandbox-demo:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/flexion-forms-sandbox-demo:latest

# For main/production environment:
docker tag sandbox:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/flexion-forms-sandbox-main:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/flexion-forms-sandbox-main:latest
```

##### Automated Deployment via GitHub Actions

Once the initial infrastructure and image are in place, GitHub Actions automatically builds and pushes new images on every commit to `main` or `demo` branches.

**Prerequisites:**
Configure these secrets in GitHub repository settings:
- `AWS_ACCOUNT_ID`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**Workflow:**
- Push to `main` branch → Builds image → Pushes to `flexion-forms-sandbox-main` ECR → App Runner auto-deploys
- Push to `demo` branch → Builds image → Pushes to `flexion-forms-sandbox-demo` ECR → App Runner auto-deploys

See `.github/workflows/deploy.yml` for workflow configuration.

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
