FROM node:24-alpine AS web-build

RUN apk upgrade --no-cache \
    && npm install --global npm@12.2.2

WORKDIR /src/mobile

ENV CI=1 \
    EXPO_NO_DOTENV=1 \
    EXPO_PUBLIC_API_URL=""

COPY mobile/package.json mobile/package-lock.json ./

RUN npm ci

COPY mobile/ ./

RUN npm run typecheck \
    && npm run build:web

RUN test -f dist/index.html \
    && if grep -R -l -E 'https?://(localhost|127[.]0[.]0[.]1)' dist; then \
        echo "A local URL was found in the web export." >&2; \
        exit 1; \
    fi


FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build

WORKDIR /src

COPY backend/Cicclo.Api/Cicclo.Api.csproj \
    backend/Cicclo.Api/

COPY backend/Cicclo.Api.Tests/Cicclo.Api.Tests.csproj \
    backend/Cicclo.Api.Tests/

RUN dotnet restore backend/Cicclo.Api.Tests/Cicclo.Api.Tests.csproj

COPY Cicclo.slnx ./
COPY backend/ ./backend/

RUN dotnet test backend/Cicclo.Api.Tests/Cicclo.Api.Tests.csproj \
        --configuration Release \
        --no-restore \
    && dotnet publish backend/Cicclo.Api/Cicclo.Api.csproj \
        --configuration Release \
        --no-restore \
        --output /app/publish \
        /p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=""

COPY --from=api-build /app/publish/ ./
COPY --from=web-build /src/mobile/dist/ ./wwwroot/

USER app

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "exec dotnet Cicclo.Api.dll --urls \"http://0.0.0.0:${PORT:-10000}\""]