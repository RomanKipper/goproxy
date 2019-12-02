# goproxy

Небольшой прокси-сервер для go-модулей. Позволяет достаточно надежно решить проблему с сертификатами ("x509 error") при локальном запуске проекта.

## Требования к системе

* Windows, Linux или MacOS
* Node 10+

## Использование

Удаляем старые модули:

```bash
go clean -modcache
```

Выключаем проверку хэш-сумм:

```bash
rm go.sum
go env -w GOSUMDB=off
```

Нацеливаем go на наш прокси:
```bash
go env -w GOPROXY=http://localhost:3000,direct
```

Запускаем прокси:

```bash
npm i
npm start
```

Как обычно, запускаем go-сервер:

```bash
make deps # optional
make dev-mobile # or whatever
```

## Настройка

Параметры настройки доступны в файле _config.json_.