frappe.ready(function () {
	console.log("✅ Web Form JS loaded");

	const checkFormLoaded = setInterval(() => {
		if (!frappe.web_form || !frappe.web_form.doc) return;

		console.log("📌 Web Form fully loaded");
		clearInterval(checkFormLoaded);

		// === 1️⃣ Add Dynamic CSS after webform is ready ===
		setTimeout(() => {
			const style = document.createElement('style');
			style.innerHTML = `
			/* ====== Page Background ====== */
			body {
				background: linear-gradient(to right, #14b8a6, #2563eb) !important;
			}

			/* ====== Webform Wrapper ====== */
			.web-form-wrapper {
				background: #ffffff !important;
				border-radius: 16px !important;
				box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05) !important;
				padding: 30px !important;
				max-width: 700px !important;
				margin: 40px auto !important;
			}

			/* ====== Buttons ====== */
			.web-form-wrapper .btn-primary,
			.btn.btn-primary {
				background-color: #2563eb !important;
				border-color: #2563eb !important;
				border-radius: 8px !important;
				padding: 10px 24px !important;
				font-weight: 600 !important;
			}

			.btn-primary:hover {
				background-color: #1d4ed8 !important;
				border-color: #1d4ed8 !important;
			}

			/* ====== Inputs ====== */
			input, textarea {
				border-radius: 8px !important;
				border: 1px solid #cbd5e1 !important;
				padding: 10px !important;
			}

			label {
				color: #1e40af !important;
				font-weight: 600 !important;
			}
			`;
			document.head.appendChild(style);
			console.log("🎨 Custom CSS applied successfully");
		}, 500); // delay ensures AdminLTE loads first

		// === 2️⃣ Math CAPTCHA ===
		if (!frappe.web_form.doc.math_question) {
			const a = Math.floor(Math.random() * 10) + 1;
			const b = Math.floor(Math.random() * 10) + 1;
			frappe.web_form.set_value('math_question', `What is ${a} + ${b}?`);
		}

		frappe.web_form.validate = () => {
			const q = frappe.web_form.doc.math_question;
			const ans = parseInt(frappe.web_form.doc.math_answer);
			if (!q || isNaN(ans)) {
				frappe.msgprint("Answer the math question.");
				frappe.validated = false;
				return;
			}
			const parts = q.split(" ");
			if (parts.length < 5) return;
			const a = parseInt(parts[2]);
			const b = parseInt(parts[4]);
			if ((a + b) !== ans) {
				frappe.msgprint("Incorrect math answer.");
				frappe.validated = false;
			}
		};

		// === 3️⃣ Region → District filter ===
		frappe.web_form.on('region', (field, value) => {
			frappe.call({
				method: "africahomecare.api.get_districts_by_region",
				args: { region: value },
				callback: function (r) {
					if (r.message) {
						let districts = r.message.map(d => d.name);
						const df = frappe.web_form.fields_dict['district'];
						if (df && typeof df.set_data === "function") {
							df.set_data(districts);
							frappe.web_form.set_value('district', '');
						}
					}
				}
			});
		});

	}, 300);
});
