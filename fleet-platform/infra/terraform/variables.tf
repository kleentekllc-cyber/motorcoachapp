# Terraform Variables

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "Cloud region"
  type        = string
  default     = "us-east-1"
}

# Add more variables as needed:
# - database_instance_type
# - app_service_sku
# - etc.
