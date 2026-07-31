# 🚀 Как получить готовый SonicRefine.exe

## Способ 1: Скачать из Releases (после настройки)

После того как вы настроите GitHub репозиторий и запустите сборку,
файл появится здесь:

```
https://github.com/YOUR_USERNAME/sonicrefine/releases
```

---

## Способ 2: Настройка с нуля (10 минут)

### Шаг 1: Создайте GitHub репозиторий

1. Зайдите на https://github.com/new
2. Название: `sonicrefine`
3. Приватность: Public или Private
4. Нажмите **Create repository**

### Шаг 2: Загрузите код

#### Вариант A: Через Git (рекомендуется)
```powershell
# Клонируйте этот проект к себе
cd C:\Projects

# Инициализируйте Git
git init sonicrefine
cd sonicrefine

# Скопируйте все файлы проекта сюда, затем:
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sonicrefine.git
git push -u origin main
```

#### Вариант B: Через веб-интерфейс
1. На странице репозитория нажмите **Add file** → **Upload files**
2. Перетащите все файлы проекта
3. Нажмите **Commit changes**

### Шаг 3: Запустите сборку

1. Откройте репозиторий на GitHub
2. Перейдите во вкладку **Actions**
3. Слева выберите **Build Desktop (Manual)**
4. Нажмите **Run workflow**
5. Введите версию: `1.0.0`
6. Отметьте **Create GitHub Release?** ✓
7. Нажмите **Run workflow**

### Шаг 4: Дождитесь сборки

⏱️ Сборка занимает **10-15 минут**

Следите за прогрессом во вкладке **Actions**.

### Шаг 5: Скачайте готовый .exe

После успешной сборки:

1. Перейдите во вкладку **Releases** (справа на главной странице)
2. Найдите последний релиз **SonicRefine v1.0.0**
3. Скачайте:
   - `SonicRefine-Setup-1.0.0.exe` — установщик
   - `SonicRefine-Portable-1.0.0.exe` — portable версия

---

## Структура репозитория

```
sonicrefine/
├── .github/
│   └── workflows/
│       ├── build-desktop.yml         # Автосборка по тегам
│       └── build-desktop-manual.yml  # Ручной запуск
├── desktop/                           # Electron приложение
│   ├── src/
│   │   ├── main/                      # Backend
│   │   └── renderer/                  # UI
│   ├── assets/
│   │   └── icon.svg                   # Иконка
│   ├── package.json
│   └── README.md
├── src/                               # Web-версия (Next.js)
├── backend/                           # Python API (опционально)
└── README.md
```

---

## Автоматическая сборка (для продвинутых)

Чтобы автоматически создавать релизы при пуше тега:

```bash
# Создайте тег
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions автоматически:
# 1. Соберёт .exe
# 2. Создаст Release
# 3. Прикрепит файлы
```

---

## Решение проблем

### ❌ Workflow не запускается
- Убедитесь, что папка `.github/workflows/` существует
- Проверьте, что файлы `.yml` загружены

### ❌ Сборка падает с ошибкой
- Проверьте логи во вкладке **Actions**
- Частая причина: неправильный `package.json`

### ❌ Releases пустой
- Убедитесь, что отметили **Create GitHub Release?**
- Или создайте тег: `git tag v1.0.0 && git push origin v1.0.0`

---

## Обновление версии

1. Перейдите в **Actions** → **Build Desktop (Manual)**
2. Введите новую версию: `1.0.1`
3. Запустите workflow
4. Новый релиз появится автоматически
