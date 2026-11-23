FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN sh mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S oliveconnect && adduser -S -G oliveconnect oliveconnect
COPY --from=build /app/target/oliveconnect.jar /app/app.jar
USER oliveconnect
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=10 CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
