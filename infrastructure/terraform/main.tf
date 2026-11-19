# Infrastructure as Code for SmartBus on Azure:
#   Resource group -> Azure Container Registry -> Azure Container Instances (one container group, 4 containers)
# Containers in one ACI group share localhost, so frontend/backend/ML/db talk over 127.0.0.1.
# LIMITATION (demo-grade): the PostgreSQL container has no persistent volume here; use Azure Database
# for PostgreSQL or an Azure Files share for anything beyond a demo.

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group
  location = var.location
}

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_container_group" "app" {
  name                = "smartbus"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = var.dns_label

  image_registry_credential {
    server   = azurerm_container_registry.acr.login_server
    username = azurerm_container_registry.acr.admin_username
    password = azurerm_container_registry.acr.admin_password
  }

  container {
    name   = "frontend"
    image  = "${azurerm_container_registry.acr.login_server}/smartbus-frontend:${var.image_tag}"
    cpu    = 0.5
    memory = 0.5
    ports {
      port     = 80
      protocol = "TCP"
    }
    environment_variables = { BACKEND_HOST = "127.0.0.1" }
  }

  container {
    name   = "backend"
    image  = "${azurerm_container_registry.acr.login_server}/smartbus-backend:${var.image_tag}"
    cpu    = 1
    memory = 1.5
    environment_variables = {
      DB_URL         = "jdbc:postgresql://127.0.0.1:5432/smartbus"
      DB_USER        = "smartbus"
      PREDICTION_URL = "http://127.0.0.1:8000"
      ADMIN_EMAIL    = var.admin_email
    }
    secure_environment_variables = {
      DB_PASSWORD    = var.db_password
      JWT_SECRET     = var.jwt_secret
      ADMIN_PASSWORD = var.admin_password
    }
  }

  container {
    name   = "prediction-service"
    image  = "${azurerm_container_registry.acr.login_server}/smartbus-prediction-service:${var.image_tag}"
    cpu    = 0.5
    memory = 1
  }

  container {
    name   = "db"
    image  = "${azurerm_container_registry.acr.login_server}/smartbus-database:${var.image_tag}"
    cpu    = 0.5
    memory = 1
    environment_variables        = { POSTGRES_DB = "smartbus", POSTGRES_USER = "smartbus" }
    secure_environment_variables = { POSTGRES_PASSWORD = var.db_password }
  }
}
