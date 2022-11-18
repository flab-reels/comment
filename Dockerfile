FROM eclipse-temurin:11-jdk-alpine as build
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]