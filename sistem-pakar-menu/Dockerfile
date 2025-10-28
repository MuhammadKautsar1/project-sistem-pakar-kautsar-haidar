# Gunakan Node versi ringan
FROM node:18-alpine

# Set workdir
WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies (tanpa dev)
RUN npm install --omit=dev

# Copy semua source code
COPY . .

# Expose port
EXPOSE 8080

# Jalankan server
CMD ["node", "src/server.js"]
