# 🔒 Política de Seguridad

## 🛡️ Versiones Soportadas

| Versión | Soporte          |
|---------|------------------|
| 2.1.x   | ✅ Soportada     |
| < 2.0   | ❌ No soportada  |

## 🚨 Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad en este proyecto, por favor:

1. **NO la publiques** en issues públicos
2. Envía un email a: [seguridad@blatteryasociados.com]
3. Incluye:
   - Descripción detallada
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de mitigación (opcional)

Responderemos en un plazo de **48 horas** y trabajaremos contigo para resolver el problema.

## ⚠️ Consideraciones de Seguridad

### Variables de Entorno

**❌ NUNCA hagas esto:**
```yaml
# docker-compose.yml - MAL
environment:
  POSTGRES_PASSWORD: mi_password_123
```

**✅ HAZ esto:**
```yaml
# docker-compose.yml - BIEN
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

Luego configura el archivo `.env` (que está en `.gitignore`):
```env
POSTGRES_PASSWORD=un_password_muy_seguro_y_largo
```

### Credenciales en Código

**🔴 PROHIBIDO:**
- Hardcodear passwords en el código
- Subir archivos `.env` a git
- Compartir credenciales en chat/email
- Usar passwords débiles (ej: "123456", "password")

**🟢 OBLIGATORIO:**
- Usar variables de entorno
- Generar passwords de 32+ caracteres
- Rotar credenciales regularmente
- Usar gestores de secretos (AWS Secrets Manager, Vault, etc.) en producción

### JWT Secrets

**Requisitos mínimos:**
- Mínimo 32 caracteres
- Caracteres aleatorios (letras, números, símbolos)
- Único por entorno (dev, staging, prod)

**Generar un JWT secret seguro:**
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Base de Datos

**Producción:**
- ✅ Usar SSL/TLS para conexiones
- ✅ Limitar acceso por IP (firewall)
- ✅ Usuario específico con permisos mínimos
- ✅ Backups encriptados
- ✅ Monitoreo de queries sospechosas

**Desarrollo:**
- ⚠️ No usar datos reales de producción
- ⚠️ Usar credenciales diferentes
- ⚠️ No exponer puertos públicamente

### Dependencias

**Mantener actualizadas:**
```bash
# Backend
cd backend
npm audit
npm audit fix

# Frontend
cd frontend
npm audit
npm audit fix
```

**Automatización:**
- Usa Dependabot (GitHub)
- Revisa CVEs regularmente
- Actualiza dependencias críticas inmediatamente

### Autenticación

**Implementado:**
- ✅ JWT con expiración (7 días)
- ✅ Passwords hasheados con bcrypt (10 rounds)
- ✅ Validación de ownership (usuarios solo ven sus datos)

**Pendiente:**
- [ ] Refresh tokens
- [ ] Rate limiting en login
- [ ] 2FA (autenticación de dos factores)
- [ ] Bloqueo de cuenta tras intentos fallidos

### CORS

**Producción:**
```typescript
// main.ts
app.enableCors({
  origin: ['https://tudominio.com'], // ⚠️ Especificar dominios permitidos
  credentials: true,
});
```

**NO uses en producción:**
```typescript
app.enableCors({
  origin: '*', // ❌ Permite cualquier origen
});
```

### SQL Injection

**Protección implementada:**
- ✅ TypeORM con queries parametrizadas
- ✅ Validación con class-validator
- ✅ DTOs en todos los endpoints

**Ejemplo seguro:**
```typescript
// ✅ BIEN - TypeORM parametriza automáticamente
await repository.findOne({ where: { email } });

// ❌ MAL - Query manual sin sanitizar
await repository.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### XSS (Cross-Site Scripting)

**Frontend:**
- ✅ React escapa contenido automáticamente
- ⚠️ Cuidado con `dangerouslySetInnerHTML`

### HTTPS

**Producción:**
- ✅ Obligatorio usar HTTPS
- ✅ Certificados SSL válidos (Let's Encrypt)
- ✅ HSTS headers

### Logs

**NO logguear:**
- ❌ Passwords
- ❌ Tokens JWT
- ❌ Datos de tarjetas de crédito
- ❌ Información personal sensible

**SÍ logguear:**
- ✅ Intentos de login fallidos
- ✅ Cambios en datos críticos
- ✅ Errores del sistema
- ✅ Accesos sospechosos

## 🔐 Checklist de Seguridad Pre-Producción

Antes de deployar a producción, verifica:

- [ ] Todas las variables de entorno configuradas
- [ ] Passwords seguros (32+ caracteres)
- [ ] JWT secret rotado y seguro
- [ ] CORS configurado con dominios específicos
- [ ] HTTPS habilitado
- [ ] Rate limiting implementado
- [ ] Logs configurados (sin datos sensibles)
- [ ] Backups automáticos configurados
- [ ] Dependencias actualizadas
- [ ] Tests de seguridad ejecutados
- [ ] Firewall configurado
- [ ] Acceso a base de datos restringido
- [ ] Monitoreo de errores activo
- [ ] Plan de respuesta a incidentes documentado

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NestJS Security](https://docs.nestjs.com/security/encryption-and-hashing)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

## 📝 Historial de Seguridad

| Fecha | Versión | Cambio |
|-------|---------|--------|
| Nov 2025 | 2.1.0 | Implementación de variables de entorno para credenciales |
| Nov 2025 | 2.0.0 | Sistema inicial con JWT y bcrypt |

---

**Última actualización**: Noviembre 2025
**Mantenido por**: Equipo de Desarrollo - Blatter y Asociados
