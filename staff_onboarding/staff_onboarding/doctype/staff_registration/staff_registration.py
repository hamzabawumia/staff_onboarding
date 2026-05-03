# Copyright (c) 2026, hamza bawumia and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import random_string

from .math_captcha_mixin import MathCaptchaMixin

class staff_registration(MathCaptchaMixin):

    def after_insert(self):
        self.ensure_roles_exist()
        if self.i_am_a_ in ["Doctor", "Nurse"]:
            self.create_user()
        elif self.i_am_a_ == "I Need Home Care Service":
            self.create_lead()  # Register as a Lead in the CRM

    def ensure_roles_exist(self):
        """Make sure Doctor and Nurse roles exist."""
        roles = ["Doctor", "Nurse"]  # Patient role removed
        for r in roles:
            if not frappe.db.exists("Role", r):
                frappe.get_doc({"doctype": "Role", "role_name": r}).insert(ignore_permissions=True)


    def create_user(self):
        """Create a Frappe User for Doctor or Nurse."""
        if frappe.db.exists("User", self.email):
            frappe.throw("A user with this email already exists.")

        role_map = {
            "Doctor": "Doctor",
            "Nurse": "Nurse"
        }

        selected_role = role_map.get(self.i_am_a_)
        if not selected_role:
            frappe.throw("Invalid role selection.")

        # Get decrypted password
        plain_password = self.get_password("password")

# since we are using a Password field in the registration doctype,
# Frappe automatically hashes the value stored in a Password field before saving to the database.
#
# So when you do:
#
# "new_password": self.password
# You are actually assigning a hashed password to new_password,
# and Frappe hashes it again, which breaks the login.
#
# To prevent the above issue, you need to decrypt the password first.

        user = frappe.get_doc({
            "doctype": "User",
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone_number,
            "send_welcome_email": 1,
            "enabled": 1,
            "new_password": plain_password,
            "roles": [{"role": selected_role}]
        })

        user.flags.ignore_password_policy = True
        user.insert(ignore_permissions=True)
        frappe.db.commit()




    def create_lead(self):
        """Create a Lead for home care service."""
        lead_name = f"{self.first_name} {self.last_name}"
        if frappe.db.exists("Lead", {"email_id": self.email}):
            frappe.throw(_("Your email is already registered with us as a Client."))

        lead = frappe.get_doc({
            "doctype": "Lead",
            "lead_name": lead_name,
            "status": "Interested",
            "email_id": self.email,
            "phone": self.phone_number,
            "territory": "All Territories"
        })

        lead.insert(ignore_permissions=True)
        frappe.db.commit()

