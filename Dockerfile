FROM eclipse-temurin:11-jdk-alpine
WORKDIR /app
COPY ./ ./
RUN chmod +x gradlew
RUN ./gradlew clean build --no-daemon
ENTRYPOINT ["java", "-jar", "build/libs/*.jar"]