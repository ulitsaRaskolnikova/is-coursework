= Модель ИС "Регистратор доменных имён"

*Выполнили:* \ Малышев Никита Александрович (409067),\ Зинченко Иван Николаевич (408657)

Хеш коммита с SRS(ветка srs): `a95e42613364b1a6e1d34e7f11b58675ca561a25`

Хеш(sha1) файла SRS: `46a069b66f43797ac2afc61b9693cfdd1b7c6ffe`

#outline(title: "Содержание")

= Инфологическая модель

#link("https://mermaid.live/edit#pako:eNq1GFlv4jj4r0SR5q3tAoUevNGSblHLsRzdnVElyyQGPE3srO1Aj-l_XzsOhxMSGMpWVVC-w_7uIx-2Sz1k123EmhhOGQyeiWU1ej0wGjh960O9WVYUYc-S_8927-HZ1jCBXoWFAoh9CR51Wn-NHAMVQs4XlHlgBvlMw8eU-ggSzQVcSiaYBcgzkZgD6AWYJEfhAHEBg1C8Wy5DUCAPQJHFRaG3gft8jtkbo-E9uGvcDruFmsSwiCMGYsTdCgEjMQMT6ArKwAsmnqUeGvWTUzK2wmjsYxfIq-ERxHXajdYjeGo8tpqNYavbAcPug9NZSh4bVdAXRPYTfl9R0GuIGeIrnHZOfBGQNCLilv7ZlPSfXqv_HWiBe33n7iDzYiIsy4NvHIzRhDKUChICx_4yOL5k1x_djlPZGcoEBigTyWM8VVKGDLvoCJI0u9JinSJRuGCYTK3Jvx7JCBPTv1OCKkW-luGK53t7-2vqdAag79x2-82d_veoDCuSljuBMuSqQiHeQmSph2EK5RcDMId-hNYRJIR_BFWkJk3n0fkzTrwDtdE1gXAgY32OGN_imzD0cY5Yvy3ybaM_PCjvvnwraA2d9s6rXchEJuUFCoCKUEos_bMBF4gFlnpsZKVKhP8lFVWLk4HrHNYZZLhKYKY8rqQUVEAfwIBG5DddHUJ8iBb7uUSL_QWfFET_l7zRa3xvO50h6Pac_n4puFWVpELQEDGoFNF4s4omNCF8CxARwMfkxXDdptMSWu1gwOBCgwOZx1KD5RFGGACN3Jr7jM4PSP6ikm0ac908F1hOLrKsIhyKzeKUgJToPoWeoaUbcUEDaVQ1ERoYCXRnkKhs3mrDZc1OOXMwbAxHg52eXJ6S8lrGqwd7IeGXjKbe-Q5IFJGDzajTPJoCyv9YRS1Dk4h4K2vuCrwj5Nffzs19t_sAnCfpmOMppK0ZT_h5eZaxegJfoPGM0heQ6febl-4Vhflxm47PraYuDCM4kbVv72iRG9OT0wSdRtvZOW76cIxyNid5OKfH2H_uuv2bVrPpdA4XaTnw74qbxOJ6V1rbOybVwKXX4qs2-0yiM6cRW3V2BcLhliKanaZB22nfHNjGd4-mAQrGKmNlWbXUY89YUMszGDiDwT6tLFeynwtR0MGg6yLOzWRDE2nImQFb2TF5j2-DU5QqNR6abx2sMOfRAY3Jh1wALaFpmW_frNP0n0ydx7jrD-5bvUEWb3yS-PXr9JR-GLt9XZpI1iBtnzRhzlZdzJPZbw1yvVDKv4Q8WesUTTye8j_UlqZpE9yadr0zGWem6cyFpFDaeBFQFHRBEpIYtCHhempXdC4lQgZ3znHryThWyIdSoTWlxqRJ12dj4vqRh9JaFXDopYgDQXNuyQ6Hhjmy6BRfModo99ApU1lTzJk0_v2uMXur4kEBFjnGNWuWIk4qDJ3kxEuGQUqUlKXtVxi1RzFwqbCstrFE9ok9Zdiz6xPoc3Qib2eyzsl3O65Sz7aYIblv24rPQxMY-UKxfUq-EJIflAZ2XbBIcjIaTWerc3T_ST4hLkk00PGwrP8rShgJOngj7uocRORMdKsasl0vX9Sq8U12_cN-le-l6lm5dFktVyvV2kWpVr08sd_seqVcO7sunV-XSuXqRfWqen71eWK_x8KVzi6vKrVa7bp0LdnK5xeVExvFErT1h874e-fnf7mS5BA")[#underline("Ссылка")]

#image("mermaid-diagram-2025-10-10-225445.png")

= Создание БД

#let create-db = read("sql/create-db.sql")

#raw(create-db, lang: "sql")

= Удаление БД

#let delete-db = read("sql/delete-db.sql")

#raw(delete-db, lang: "sql")

= Генерация данных

#let generate = read("sql/generate.sql")

#raw(generate, lang: "sql")

= Функции

== Удалить все просроченные заказы

#let maintenance_delete_stale_orders = read("sql/functions/maintenance_delete_stale_orders.sql")

#raw(maintenance_delete_stale_orders, lang: "sql")

== Удалить все просроченные email_tokens

#let maintenance_delete_expired_email_tokens = read("sql/functions/maintenance_delete_expired_email_tokens.sql")

#raw(maintenance_delete_expired_email_tokens, lang: "sql")

== Вернуть домены, по которым сегодня нужно отправлять напоминания

#let reminders_domains_due_today = read("sql/functions/reminders_domains_due_today.sql")

#raw(reminders_domains_due_today, lang: "sql")

== Административный-отчёт за месяц (пользователи, домены, сумма оплат)

#let admin_monthly_report = read("sql/functions/admin_monthly_report.sql")

#raw(admin_monthly_report, lang: "sql")

== Формирование списока всех просроченных доменов

#let get_expired_domains = read("sql/functions/get_expired_domains.sql")

#raw(get_expired_domains, lang: "sql")