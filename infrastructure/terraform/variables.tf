variable "location" {
  type    = string
  default = "centralindia"
}

variable "resource_group" {
  type    = string
  default = "rg-smartbus"
}

variable "acr_name" {
  type        = string
  description = "Globally unique ACR name (lowercase letters/digits only)"
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "dns_label" {
  type        = string
  default     = "smartbus-demo"
  description = "Public DNS label (must be unique in the region)"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "admin_email" {
  type = string
}

variable "admin_password" {
  type      = string
  sensitive = true
}
