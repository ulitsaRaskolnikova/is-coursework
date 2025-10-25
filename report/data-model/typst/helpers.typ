#let insertSql(filePath) = {
  let sql = read("../" + filePath)
  raw(sql, lang: "sql")
}

#let ctx_dropLines(path) = {
  let sql = read("../" + path)
  let lines = sql.split("\n")
  let createLines = lines.filter(
    l => l.trim().starts-with("CREATE INDEX")
  )
  createLines
    .map(
      l => {
        let parts = l.trim().split(" ")
        let idx = parts.at(2)
        "DROP INDEX " + idx + ";"
      }
    )
}

#let ctx_createLines(path) = {
  let sql = read("../" + path)
  let lines = sql.split("\n")
  let createLines = lines.filter(
    l => l.trim().starts-with("CREATE INDEX")
  )
  createLines
}

#let ctx_indexList(path) = {
  let sql = read("../" + path)
  let lines = sql.split("\n")
  let createLines = lines
    .filter(l => l.trim().starts-with("CREATE INDEX"))
    .map(str => str.find(regex("^CREATE INDEX [\w]+")).trim("CREATE INDEX "))
    .map(str => [+ #str])
    .join()

  createLines
}

#let showExplain(filePath) = {
  let sql = read("../" + filePath)
  let sqlFileName = filePath.split("/")
    .at(-1)
    .trim(".sql")
  let explain = read("../sql/explain-results/" + sqlFileName + ".txt")
  let explainIdx = read("../sql/explain-results/" + sqlFileName + ".idx.txt")

  let cost = float(explain.split("\n")
    .at(0)
    .find(regex("cost=\d+.\d+..\d+.\d+"))
    .split("..")
    .at(-1))
  let costIdx = float(explainIdx.split("\n")
    .at(0)
    .find(regex("cost=\d+.\d+..\d+.\d+"))
    .split("..")
    .at(-1))
  let costCoeff = calc.round(cost/costIdx, digits: 1)

  let executionTime = float(explain.split("\n")
    .at(-1)
    .split(":")
    .at(-1)
    .trim(regex("[ (ms)]")))
  let executionTimeIdx = float(explainIdx.split("\n")
    .at(-1)
    .split(":")
    .at(-1)
    .trim(regex("[ (ms)]")))
  let executionTimeCoeff = calc.round(executionTime/executionTimeIdx, digits: 1)

  [
    Примерный SQL запрос:

    #raw(sql, lang: "sql")
    
    План выполнения без индексов:

    #raw(explain)

    План выполнения с индексами:

    #raw(explainIdx)

    Максимальный cost параметр уменьшился в #costCoeff раз с #cost до #costIdx.

    Время исполнения запроса уменьшилось в #executionTimeCoeff раз с #executionTime мс до #executionTimeIdx мс.

    #if executionTimeCoeff > 10 [
      Индекс помогает и существенно ускоряет систему.
    ] else if executionTimeCoeff <= 10 and executionTimeCoeff > 1.5 [
      Индекс помогает и ускоряет систему.
    ] else if executionTimeCoeff <= 1.5 and executionTimeCoeff > 1 [
      Индекс не существенно ускоряет систему. Вероятно, его можно удалить.
    ] else [
      Индекс не влияет на запрос. Рекомендовано его удалить. Или не соблюдены условия для эффективного использования индекса.
    ]
  ]
}