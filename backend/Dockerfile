FROM node:20-alpine

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente de la aplicación
COPY . .

# Exponer el puerto configurado para la API
EXPOSE 3000

# Variable de entorno por defecto
ENV PORT=3000

# Comando para iniciar el servidor
CMD ["npm", "start"]
