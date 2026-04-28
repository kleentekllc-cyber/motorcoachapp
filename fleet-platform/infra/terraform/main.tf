terraform {
  required_version = ">= 1.6.0"
  required_providers {
    # Add cloud providers here when ready:
    # azurerm = {
    #   source  = "hashicorp/azurerm"
    #   version = "~> 3.0"
    # }
    # aws = {
    #   source  = "hashicorp/aws"
    #   version = "~> 5.0"
    # }
  }
}

# This is a skeleton. Later, define:
# - Postgres DB (Supabase or cloud-native)
# - Backend app service (Render/Azure App Service)
# - Storage buckets
# - Networking/VPC
# - DNS/CDN

# Example placeholder:
# resource "azurerm_postgresql_server" "fleet_db" {
#   name                = "fleet-db-${var.environment}"
#   ...
# }
