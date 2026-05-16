const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Load environment variables if .env exists
if (fs.existsSync(path.join(process.cwd(), '.env'))) {
    require('dotenv').config();
}

class EmailService {
    constructor() {
        this.transporter = null;
        this.configured = false;
        this.emailUser = null;

        // Auto-configure from .env
        this.autoConfigure();
    }

    autoConfigure() {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (user && pass) {
            this.configure(user, pass);
        }
    }

    configure(user, pass) {
        try {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user, pass }
            });
            this.emailUser = user;
            this.configured = true;
            logger.info('✅ Email service configured for: ' + user);
            return { success: true };
        } catch (error) {
            logger.error('❌ Error configuring email: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    async sendBuzonAlert(destinatario, cliente, mensajes) {
        if (!this.configured) return { success: false, error: 'Email service not configured' };

        const cantidad = mensajes.length;
        const asunto = `📬 ${cantidad} Nuevo(s) Mensaje(s) en Buzón SUNAT - ${cliente.empresa || cliente.ruc}`;
        
        const mensajeHTML = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Buzón Electrónico SUNAT</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Se han detectado <strong>${cantidad}</strong> nuevos mensajes para:</p>
                    <p><strong>RUC:</strong> ${cliente.ruc}<br><strong>Empresa:</strong> ${cliente.empresa}</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead><tr style="background: #f5f5f5;"><th style="padding: 10px; text-align: left;">Asunto</th><th style="padding: 10px; text-align: left;">Fecha</th></tr></thead>
                        <tbody>
                            ${mensajes.map(m => `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${m.asunto}</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${m.fecha}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
                    Sistema SUNAT Bot - Notificación Automática
                </div>
            </div>
        `;

        try {
            const info = await this.transporter.sendMail({
                from: `"SUNAT Bot" <${this.emailUser}>`,
                to: destinatario,
                subject: asunto,
                html: mensajeHTML
            });
            logger.info('✅ Email sent: ' + info.messageId);
            return { success: true };
        } catch (error) {
            logger.error('❌ Error sending email: ' + error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
