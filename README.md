# SportApp

SportApp es una aplicación creada con **React Native + Expo** pensada para ayudar en la gestión y el seguimiento de dietas, facilitar la preparación de los platos al cocinar, así como poder hacer preguntas en el Chat con IA para recibir recomendaciones o sugerencias sobre los platos y la dieta en general.

## Pantallas principales

### **Home**
Es la pantalla principal en la que se muestra un **calendario visual** para seguir el cumplimiento de la dieta y una **lista de comidas del día**, que permite ver ingredientes, marcarlas como completadas o añadirlas al libro de recetas rápidamente.

Las principales funciones incluyen:
- Visualizar un calendario con los días **completados, fallados y las rachas activas**.
- Consultar los platos del día seleccionado del calendario.
- Marcar un plato como completado.
- Añadir un plato al libro de recetas.
- Acceder de forma rápida al libro de recetas.
- Importar un archivo **JSON** con comidas.
- Exportar un archivo **JSON** con las comidas guardadas.

---

### **Temporizadores**
Permite gestionar y ver los **temporizadores y cronómetros** para facilitar la cocina.
Al finalizar, se muestran notificaciones con **acciones rápidas** para gestionar el temporizador directamente desde la notificación.

---

### **Chat con IA**
Esta pantalla permite hacer preguntas y recibir recomendaciones sobre la dieta y diferentes recetas, así como:
- Crear nuevas recetas para añadir al plan.
- Modificar/Preguntar sobre recetas ya existentes con valores nutricionales similares.

Funciones adicionales:
- Acciones al mantener pulsado un mensaje: eliminar, copiar, seleccionar uno o varios mensajes.
- Crear y eliminar chats.
- Ver chats anteriores.
- Integración con **GPT-4.1 mini** para las respuestas y **DALL·E 3** para la generación de imágenes desde un mensaje.

---

### **Lista de la compra**
Muestra una lista editable para organizar ingredientes y productos, en la que se puede:
- Añadir elementos manualmente.
- Marcar elementos como completados.
- Copiar toda la lista al portapapeles para compartirla fácilmente.

---

## Otras pantallas

### **Lista de comidas**
Muestra todas las comidas del día seleccionado junto con sus ingredientes y estado (completado o no).
Funciones disponibles:
- Añadir un plato al libro de recetas.
- Acceder a los **detalles del plato**.
- Añadir nuevas comidas.
- Repetir un plato en otros días.
- Intercambiar platos entre días seleccionados.

---

### **Detalles de comidas**
Pantalla dedicada a la comida seleccionada:
- Ver la receta completa.
- Consultar o añadir comentarios.
- Editar la información de la comida.
- Eliminar el plato.
- Enviar la información directamente al **chat con IA** para hacer preguntas.

---

### **Libro de recetas**
Una colección de recetas guardadas mediante el marcador.
Funciones:
- Visualizar el nombre y los ingredientes de cada plato.
- Desmarcar recetas guardadas.
- Acceder a los detalles completos de cada plato.