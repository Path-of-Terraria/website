# Stage 1: Build the SvelteKit application
FROM node:lts-alpine AS build

WORKDIR /app

# Copy pnpm lockfile and install dependencies
COPY pnpm-lock.yaml ./
RUN pnpm fetch --frozen-lockfile

# Copy package.json and install dependencies
COPY package.json ./
RUN pnpm install --frozen-lockfile --prod

# Copy the rest of the application code
COPY . .

# Build the SvelteKit application
RUN pnpm run build

# Stage 2: Create the production-ready image
FROM node:lts-alpine AS final

WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build

# Expose the port your SvelteKit app listens on (default is 3000)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV production

# Command to run the SvelteKit application
CMD ["node", "build"]