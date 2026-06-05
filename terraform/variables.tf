variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "aws_availability_zone" {
  description = "AWS availability zone for the app subnet"
  type        = string
  default     = "us-east-1a"
}

variable "instance_type" {
  description = "EC2 instance type for the application server"
  type        = string
  default     = "t3.micro"
}
