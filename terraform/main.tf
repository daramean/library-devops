data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_vpc" "bookstorm" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "bookstorm-vpc"
  }
}

resource "aws_subnet" "app" {
  vpc_id            = aws_vpc.bookstorm.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = var.aws_availability_zone
  tags = {
    Name = "bookstorm-subnet"
  }
}

resource "aws_security_group" "bookstorm" {
  name        = "bookstorm-sg"
  description = "Allow HTTP, HTTPS and app traffic for BookStorm"
  vpc_id      = aws_vpc.bookstorm.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bookstorm-sg"
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.app.id
  vpc_security_group_ids       = [aws_security_group.bookstorm.id]
  associate_public_ip_address = true

  tags = {
    Name = "bookstorm-app-instance"
  }
}
