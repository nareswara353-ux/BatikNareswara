# Multi-stage Dockerfile for .NET Minimal API (Batik Nareswara Backend)
# Build stage using .NET SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY backend/*.csproj ./backend/
RUN dotnet restore ./backend/BatikNareswaraBackend.csproj

# Copy everything and publish
COPY . .
WORKDIR /src/backend
RUN dotnet publish BatikNareswaraBackend.csproj -c Release -o /app/publish /p:PublishTrimmed=true

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS="http://+:8080"
EXPOSE 8080

COPY --from=build /app/publish ./

ENTRYPOINT ["dotnet", "BatikNareswaraBackend.dll"]
