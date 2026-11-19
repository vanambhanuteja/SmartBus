output "app_url" {
  value = "http://${azurerm_container_group.app.fqdn}"
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}
