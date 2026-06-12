# 📷 PicMe - Proyecto FOTAZA 2 de Programacion Web 2

Aplicación web universitaria para compartir fotografías. (A implementar la opción "PicMe" para interesarse en comprarlas)
Proyecto de regularizacion para la materia Programacion Web 2-
* **URL del proyecto en producción:** https://pic-me-drab.vercel.app/
  
---
## Tecnologías usadas

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL (Hosteado en Neon)
- **ORM:** Sequelize
- **Vistas:** Pug
- **Estilos:** Bootstrap 5
- **Autenticacion:** express-session + bcrypt

## Instalacion y despliegue en Entorno Local
Para ejecutar este proyecto de forma local, hay que constar con una cuenta en Cloudinary donde puedas usar tus credenciales y una cuenta en Neon (o en su defecto tener instalado PostgreSQL) y seguir los siguientes pasos:
1. **Clonar el repositorio:**
```bash
   git clone https://github.com/florenciacastro95/PicMe.git
```

2. **Instalar dependencias de Node.js:**
```bash
npm install
```
3. **Configurar variables de entorno:**
Duplica el archivo .env.example, renombralo como .env e ingresa tus credenciales para tu base de datos y llaves de entorno
4. **Inicializar la base de datos:**
Ejecuta el script de inicialización para construir las tablas, relaciones e integridad referencial necesarias en la base de datos, para ello necesitas una cuenta en Neon. 
```bash
npm run db:init
```
Si deseas crear la base localmente deberás tener instalado postgres y ejecutar "node sql/creardb.js"
5. **Iniciar el servidor:**
```bash
npm start
```
Si hiciste todo bien, la aplicación estará accesible desde el navegador en: http://localhost:3000 :3

##  👥 Usuarios de Prueba (Base de Datos)
Cuentas de prueba dadas de alta en el sistema para validar los diferentes flujos e interacciones de la comunidad (votos, follows, comentarios):

| Nombre Real | Username | Email | Contraseña de Prueba |
| :--- | :--- | :--- | :--- |
| Florencia Magalí | fmcastro | flor@ulp.com | 123 |
| Lula Dasilva | Lula | lula@ulp.com | 123 |
| Lali Espósito | Lali | lali@gmail.com | 123 |
| Allison Swift | TaylorS | swift@ulp.com | 123 |
| Juan | Juan Lopez | juan@ulp.com | 123 |
| adan | alan | ada@ulp.com | 123 |
| Lara Croft | LaraCroft | lara@ulp.com | 123 |
| Oriana Junco | EsUnLook | orijunco@ulp.com | ori123 |

Nota: Los perfiles se inicializan con valores avatar: null y bio: null correspondientes al alcance actual de regularización. Las contraseñas ded los primeros 7 usuarios se hicieron sin validación.

---

## Alcance del Proyecto: Regularización vs. Aprobación Final (Roadmap)
Teniendo en cuenta las pautas fijadas por la cátedra para la regularización de la materia este trabajo se centró ùnicamente en la estabilización, consistencia y operatividad de los 5 módulos obligatorios, publicaciones, búsquedas, comentarios, valoraciones y módulo de seguidores.

**Planificación de aprobación**
Tengo planificada la incorporación de las funcionalidades pedidas en el enunciado, la primera funcionalidad que quiero implementar es la que le da nombre a la página, el módulo "PicMe" que es interés para comprar imágenes. También dejé un avatar genérico gris y diseño en la db donde iría la foto de perfil de cada usuario, también bio entre otros para hacer módulo de edición de perfil. También tengo planificada la implementación del perfil "moderador" además del módulo de denuncias.

## Funcionalidades

### Visitante
- Registrarse
- Iniciar sesión
- Buscar contenido
- Ver contenido sin copyright

### Usuario Autenticado
- Cerrar sesión
- Crear/Modificar/Eliminar publicación
- Buscar fotos
- Seguir/Dejar de seguir usuario
- Comentar imagen
- Eliminar comentario
- Habilitar/Deshabilitar comentarios
- Valorar imagen (1-5 estrellas)

## Notas de Despliegue en Producción (Vercel)
Al realizar el despliegue automático en la plataforma Vercel conectada a la base de datos Neon, tuve que configurar un Override de Comando de Instalación en el panel de control del proyecto:

```bash
npm install --legacy-peer-deps
```
Esta medida técnica fue necesaria para forzar la resolución estricta del árbol de dependencias de Node.js en los contenedores stateless de producción-
