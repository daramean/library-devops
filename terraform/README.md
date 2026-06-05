# Terraform provisioning

This folder contains Terraform code to provision basic AWS networking and an EC2 instance for demo purposes.

Prerequisites
- Install Terraform 1.3+ and AWS CLI.
- Configure AWS credentials (`aws configure`) or set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in environment.

Quick start (local)

```bash
cd terraform
terraform init
terraform plan -var="aws_region=us-east-1" -out plan.tfplan
terraform apply "plan.tfplan"
```

Outputs
- `app_public_ip` — public IP of the created EC2 instance.
- `security_group_id` — security group ID allowing HTTP/HTTPS/5000.

Notes & Recommendations
- This is a minimal example for development/testing. For production, use:
  - Remote state backend (S3 + DynamoDB) to share state across team members.
  - Proper VPC, subnets across multiple AZs, NAT gateways, and an autoscaling group or EKS cluster.
  - Manage secrets and credentials via IAM roles and instance profiles.

To add an S3 backend quickly, create a `backend.tf` with an `s3` backend and run `terraform init`.
