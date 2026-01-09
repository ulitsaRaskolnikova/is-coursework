#import "typst/helpers.typ": *

#set page(margin: 2cm)
#set heading(numbering: "1.")
#set text(lang: "ru")

#align(center, text([
  Курсовая работа 2 этап\
  Модель ИС "Регистратор доменных имён"
], size: 14pt, weight: "bold"))

*Выполнили:* \ Малышев Никита Александрович (409067),\ Зинченко Иван Николаевич (408657)

Хеш коммита с SRS(ветка srs): `a95e42613364b1a6e1d34e7f11b58675ca561a25```\
Хеш(sha1) файла SRS: `46a069b66f43797ac2afc61b9693cfdd1b7c6ffe`

#outline(title: "Содержание")

= Инфологическая модель

#link("https://mermaid.live/edit#pako:eNq1GFlv4jj4r0SR5q3tAoUevNGSblHLsRzdnVElyyQGPE3srO1Aj-l_XzsOhxMSGMpWVVC-w_7uIx-2Sz1k123EmhhOGQyeiWU1ej0wGjh960O9WVYUYc-S_8927-HZ1jCBXoWFAoh9CR51Wn-NHAMVQs4XlHlgBvlMw8eU-ggSzQVcSiaYBcgzkZgD6AWYJEfhAHEBg1C8Wy5DUCAPQJHFRaG3gft8jtkbo-E9uGvcDruFmsSwiCMGYsTdCgEjMQMT6ArKwAsmnqUeGvWTUzK2wmjsYxfIq-ERxHXajdYjeGo8tpqNYavbAcPug9NZSh4bVdAXRPYTfl9R0GuIGeIrnHZOfBGQNCLilv7ZlPSfXqv_HWiBe33n7iDzYiIsy4NvHIzRhDKUChICx_4yOL5k1x_djlPZGcoEBigTyWM8VVKGDLvoCJI0u9JinSJRuGCYTK3Jvx7JCBPTv1OCKkW-luGK53t7-2vqdAag79x2-82d_veoDCuSljuBMuSqQiHeQmSph2EK5RcDMId-hNYRJIR_BFWkJk3n0fkzTrwDtdE1gXAgY32OGN_imzD0cY5Yvy3ybaM_PCjvvnwraA2d9s6rXchEJuUFCoCKUEos_bMBF4gFlnpsZKVKhP8lFVWLk4HrHNYZZLhKYKY8rqQUVEAfwIBG5DddHUJ8iBb7uUSL_QWfFET_l7zRa3xvO50h6Pac_n4puFWVpELQEDGoFNF4s4omNCF8CxARwMfkxXDdptMSWu1gwOBCgwOZx1KD5RFGGACN3Jr7jM4PSP6ikm0ac908F1hOLrKsIhyKzeKUgJToPoWeoaUbcUEDaVQ1ERoYCXRnkKhs3mrDZc1OOXMwbAxHg52eXJ6S8lrGqwd7IeGXjKbe-Q5IFJGDzajTPJoCyv9YRS1Dk4h4K2vuCrwj5Nffzs19t_sAnCfpmOMppK0ZT_h5eZaxegJfoPGM0heQ6febl-4Vhflxm47PraYuDCM4kbVv72iRG9OT0wSdRtvZOW76cIxyNid5OKfH2H_uuv2bVrPpdA4XaTnw74qbxOJ6V1rbOybVwKXX4qs2-0yiM6cRW3V2BcLhliKanaZB22nfHNjGd4-mAQrGKmNlWbXUY89YUMszGDiDwT6tLFeynwtR0MGg6yLOzWRDE2nImQFb2TF5j2-DU5QqNR6abx2sMOfRAY3Jh1wALaFpmW_frNP0n0ydx7jrD-5bvUEWb3yS-PXr9JR-GLt9XZpI1iBtnzRhzlZdzJPZbw1yvVDKv4Q8WesUTTye8j_UlqZpE9yadr0zGWem6cyFpFDaeBFQFHRBEpIYtCHhempXdC4lQgZ3znHryThWyIdSoTWlxqRJ12dj4vqRh9JaFXDopYgDQXNuyQ6Hhjmy6BRfModo99ApU1lTzJk0_v2uMXur4kEBFjnGNWuWIk4qDJ3kxEuGQUqUlKXtVxi1RzFwqbCstrFE9ok9Zdiz6xPoc3Qib2eyzsl3O65Sz7aYIblv24rPQxMY-UKxfUq-EJIflAZ2XbBIcjIaTWerc3T_ST4hLkk00PGwrP8rShgJOngj7uocRORMdKsasl0vX9Sq8U12_cN-le-l6lm5dFktVyvV2kWpVr08sd_seqVcO7sunV-XSuXqRfWqen71eWK_x8KVzi6vKrVa7bp0LdnK5xeVExvFErT1h874e-fnf7mS5BA")[#underline("Ссылка")]

#image("mermaid-diagram-2025-10-10-225445.png")

= Создание БД

#insertSql("sql/create-db.sql")

= Удаление БД

#insertSql("sql/delete-db.sql")

= Генерация данных <data_generation>

#insertSql("sql/generate.sql")

= Доказательство необходимости индексов

Докажем, что индексы, которые созданы через ```sql CREATE INDEX``` повышают производительность системы. Имеются следующие индексы:

#ctx_indexList("sql/create-db.sql")

Теоретически можно объяснить применение индексов:

+ auth_factor_user_id_idx \ Индекс по user_id ускоряет выборку всех способов 2FA, принадлежащих конкретному пользователю.

+ email_validation_token_expires_at_idx \ Позволяет быстро находить просроченные или активные токены, например при очистке старых записей.

+ domain_expires_at_idx \ Ускоряет поиск доменов, срок действия которых подходит к концу (для напоминаний и продлений).

+ dns_record_domain_id_idx \ Позволяет быстро получить все DNS-записи конкретного домена при открытии панели управления DNS.

+ app_order_user_id_idx \ Ускоряет выборку всех заказов пользователя.

+ app_order_created_at_paid_at_idx\ Это частичный составной индекс нужен, чтобы быстро находить неоплаченные заказы.

+ app_order_item_order_id_idx \ Позволяет быстро получить все позиции внутри конкретного заказа.

+ payment_operation_order_id_idx \ Ускоряет выборку операций оплаты, связанных с определённым заказом.

+ payment_status_op_id_idx \ Помогает быстро находить историю изменения статусов для конкретной операции.

+ refund_op_id_idx \ Ускоряет поиск возвратов по операции оплаты.

+ event_at_idx\ Ускоряет поиск по временным меткам событий.

+ event_actor_idx \ Позволяет быстро найти все действия конкретного пользователя, администратора или системы.

+ user_session_user_id_idx \ Ускоряет выборку всех активных сессий пользователя.

+ user_session_expires_at_idx \ Позволяет быстро очистить просроченные сессии.

Для проверки необходимости индексов будем сравнивать планы выполнения SQL запросов при помощи команды `EXPLAIN ANALYZE`. Сначала выполним её без индексов, затем после. Выполнение будет на тестовых данных, которые сгенерированы скриптом выше (@data_generation).

Рассмотрим прецеденты из SRS, которые выполняют операции чтения из базы данных и обращаются к полям, отличным от первичных или уникальных.

Удалим индексы из БД, выполнив команду:

#raw(ctx_dropLines("sql/create-db.sql").join("\n"), lang: "sql")

Не забудем выполнить `ANALYZE`. Проведём анализ планов и затем вернём индексы обратно.

#raw(ctx_createLines("sql/create-db.sql").join("\n"), lang: "sql")

Проведём сравнение планов выполнения запросов.

== R2 - Аутентификация пользователя

#showExplain("sql/precedents/r2-get-2fa.sql")

== CA2/B1 - Оформление заказа и Оплата заказа

#showExplain("sql/precedents/ca2-b1-get-unpaid.sql")

#showExplain("sql/precedents/ca2-b1-get-status-history.sql")

#showExplain("sql/precedents/ca2-b1-get-refund-history.sql")

== DNS1 - Управление DNS

#showExplain("sql/precedents/dns1-set-source.sql")

== PR2 - Напоминания о продлении

#showExplain("sql/precedents/pr2-notificate-for-extend.sql")

== LK1/ADM1 - Личный кабинет

#showExplain("sql/precedents/lk1-adm1-lk.sql")

== LOG1 - Аудит действий

#showExplain("sql/precedents/log1-get-by-actor.sql")

#showExplain("sql/precedents/log1-get-by-time.sql")

== Использования во функциях

#showExplain("sql/raw-functions/maintenance_delete_expired_domains.sql")

#showExplain("sql/raw-functions/maintenance_delete_expired_sessions.sql")

= Функции

== Удалить все просроченные заказы

Функция возвращает количество удалённых записей заказов.

#insertSql("sql/functions/maintenance_delete_stale_orders.sql")

== Удалить все просроченные email_tokens

Функция возвращает количество удалённых email_tokens записей.

#insertSql("sql/functions/maintenance_delete_expired_email_tokens.sql")

== Административный отчёт за месяц (пользователи, домены, сумма оплат)

Функция возвращает таблицу с колонками:
- Начало месяца
- Конец месяца
- Кол-во созданных пользователей
- Кол-во созданных доменов
- Кол-во оплаченных заказов
- Сумма оплаченных заказов
- Дата первого платежа
- Дата последнего платежа

#insertSql("sql/functions/admin_monthly_report.sql")

== Формирование списка всех просроченных доменов

Функция возвращает таблицу с колонками:
- Идентификатор домена
- Полное имя домена
- Дата просрочки домена
- Дата создания домена
- Дата активации домена

#insertSql("sql/functions/get_expired_domains.sql")