# syntax=docker/dockerfile:1

# =============================================================================
# Build stage — produces dist/ from src/
# =============================================================================
FROM node:22-alpine AS build

# terser is the only external tool the build shells out to; without it ngapack
# falls back to posting the source to a third-party minifier API.
# Set MINIFY=false below to skip minification entirely.
RUN npm install -g terser

ENV MINIFY=true

WORKDIR /app

# Manifest and config first, so editing application source does not invalidate
# the dependency layer.
COPY package.json env.js app.routes.js ./
COPY run.bundle.js ./

# Only the bundler is needed to build; hashttp and the browser libs are not.
COPY libs/ngapack ./libs/ngapack

COPY src ./src

RUN node run.bundle.js


# =============================================================================
# Runtime stage — serves the built output
# =============================================================================
FROM node:22-alpine AS runtime

# HOST and PORT are read by env.js from the process environment, so `docker
# run -e PORT=8080` works without a .env file. No .env is copied into the image.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=7200

WORKDIR /app

# run.start.js needs the server, the route config, and the env loader.
# hashttp is the only vendored library involved; the bundler and the browser
# libraries stay in the build stage.
COPY package.json env.js app.routes.js run.start.js ./
COPY libs/hashttp ./libs/hashttp
COPY --from=build /app/dist ./dist

EXPOSE 7200

USER node

CMD ["node", "run.start.js"]
