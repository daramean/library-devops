output "app_public_ip" {
  description = "Public IP address of the OBITO STORE application instance"
  value       = aws_instance.app.public_ip
}

output "security_group_id" {
  description = "ID of the OBITO STORE security group"
  value       = aws_security_group.bookstorm.id
}

