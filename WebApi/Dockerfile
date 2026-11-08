FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /workspace

COPY ["WebApi.csproj", "./"]
RUN dotnet restore "WebApi.csproj"

COPY . .
RUN dotnet publish "WebApi.csproj" -c Release -o /workspace/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /workspace

RUN mkdir -p /workspace/data /workspace/wwwroot/drawings

COPY --from=build /workspace/publish .

EXPOSE 5098
ENV ASPNETCORE_URLS=http://+:5098

ENTRYPOINT ["dotnet", "WebApi.dll"]