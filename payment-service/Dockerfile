FROM gradle:8.5-jdk17 AS build
WORKDIR /app

ENV GRADLE_OPTS="-Dhttps.protocols=TLSv1.2,TLSv1.3"

COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY gradle ./gradle
COPY payment-service/build.gradle.kts ./payment-service/
COPY common/build.gradle.kts ./common/

RUN --mount=type=cache,target=/home/gradle/.gradle gradle :payment-service:dependencies --no-daemon

COPY payment-service/src ./payment-service/src
COPY common/src ./common/src

RUN --mount=type=cache,target=/home/gradle/.gradle gradle :payment-service:clean :payment-service:bootJar --no-daemon --no-build-cache

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

COPY --from=build /app/payment-service/build/libs/payment-service.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
