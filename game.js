// Элементы интерфейса
const gameContainer = document.getElementById('game-container');
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const helpModal = document.getElementById('help-modal');
const highScoresModal = document.getElementById('high-scores-modal');
const highScoresBody = document.getElementById('high-scores-body');
const gameOver = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const nameInput = document.getElementById('name-input');
const pointsPopup = document.getElementById('points-popup');
        
// Кнопки
const helpButton = document.getElementById('help-button');
const highScoresButton = document.getElementById('high-scores-button');
const playButton = document.getElementById('play-button');
const closeHelpButton = helpModal.querySelector('.close-button');
const closeHighScoresButton = highScoresModal.querySelector('.close-button');
const saveScoreButton = document.getElementById('save-score-button');
const playAgainButton = document.getElementById('play-again-button');
        
// Игровые элементы
const canvas = document.getElementById('yetisports-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const penguinsLeftDisplay = document.getElementById('penguins-left');
        
// Размеры холста
canvas.width = 800;
canvas.height = 600;
        
// Игровые переменные
let score = 0;
let penguinsLeft = 10;
let gameState = 'waiting'; // waiting, throwing, flying, scoring
let highScores = JSON.parse(localStorage.getItem('yetisportsHighScores')) || [];
let activePenguins = [];
        
// Возможные значения очков при попадании в мишень
const possiblePoints = [1, 5, 10, 15, 20];
        
// Изображения
const images = {
    yeti: new Image(),
    penguin: new Image(),
    orca: new Image(),
    snowball: new Image(),
    iceberg: new Image(),
    target: new Image(),
    background: new Image()
};
        
// Загрузка изображений (замените на реальные URL)
images.yeti.src = './image/15.png';
images.penguin.src = './image/8.png';
images.orca.src = './image/14.png';
images.snowball.src = './image/ball-sheet0 (1).png';
images.iceberg.src = './image/3.png';
images.target.src = './image/Target.png';
images.background.src = './image/55.png';
        
// Позиции объектов
const positions = {
    yeti: { x: 600, y: 220, width: 200, height: 280 },
    penguinStart: { x: 325, y: 325, width: 70, height: 105 },
    orca: { x: 300, y: 350, width: 250, height: 200 },
    iceberg: { x: 180, y: 370, width: 750, height: 250 },
    target: { x: 50, y: 100, width: 200, height: 200 },
    snowball: { x: 0, y: 0, width: 30, height: 30, visible: false, speedX: 0, speedY: 0 }
};
        
// Обработчики событий
helpButton.addEventListener('click', () => helpModal.style.display = 'block');
highScoresButton.addEventListener('click', showHighScores);
playButton.addEventListener('click', startGame);
closeHelpButton.addEventListener('click', () => helpModal.style.display = 'none');
closeHighScoresButton.addEventListener('click', () => highScoresModal.style.display = 'none');
saveScoreButton.addEventListener('click', saveScore);
playAgainButton.addEventListener('click', startGame);
        
// Показать таблицу рекордов
function showHighScores() {
    highScoresBody.innerHTML = '';
    const sortedScores = [...highScores].sort((a, b) => b.score - a.score).slice(0, 10);
            
    if (sortedScores.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center;">Нет рекордов</td>';
        highScoresBody.appendChild(row);
    } else {
        sortedScores.forEach((record, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${record.name}</td>
                <td>${record.score}</td>
            `;
            highScoresBody.appendChild(row);
        });
    }
            
    highScoresModal.style.display = 'block';
}
        
// Начать игру
function startGame() {
    mainMenu.style.display = 'none';
    gameScreen.style.display = 'block';
    gameOver.style.display = 'none';
            
    score = 0;
    penguinsLeft = 10;
    gameState = 'waiting';
    activePenguins = [];
            
    // Создаем начального пингвина
    createPenguin();
            
    scoreDisplay.textContent = `Очки: ${score}`;
    penguinsLeftDisplay.textContent = `Пингвины: ${penguinsLeft}`;
            
    // Обработчик клика для броска снежка
    canvas.onclick = function(e) {
        if (gameState === 'waiting') {
            throwSnowball(e);
        }
    };
            
    drawGame();
}
        
// Создать нового пингвина
function createPenguin() {
    activePenguins.push({
        x: positions.penguinStart.x,
        y: positions.penguinStart.y,
        width: positions.penguinStart.width,
        height: positions.penguinStart.height,
        state: 'waiting', // waiting, hit, flying, scored
        points: 0,
        speedX: 0,
        speedY: 0
    });
}
        
// Бросок снежка
function throwSnowball(e) {
    if (gameState !== 'waiting') return;
            
    gameState = 'throwing';
            
    // Позиция курсора
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;
            
    // Начальная позиция снежка
    positions.snowball.x = positions.yeti.x + positions.yeti.width / 2;
    positions.snowball.y = positions.yeti.y + positions.yeti.height / 2;
    positions.snowball.visible = true;
            
    // Направление и скорость снежка
    const angle = Math.atan2(mouseY - positions.snowball.y, mouseX - positions.snowball.x);
    positions.snowball.speedX = Math.cos(angle) * 10;
    positions.snowball.speedY = Math.sin(angle) * 10;
            
    // Анимация броска
    animateSnowball();
}
        
// Анимация полета снежка
function animateSnowball() {
    positions.snowball.x += positions.snowball.speedX;
    positions.snowball.y += positions.snowball.speedY;
            
    // Проверка столкновения с пингвинами
    for (let i = 0; i < activePenguins.length; i++) {
        const penguin = activePenguins[i];
        if (penguin.state === 'waiting' && checkCollision(positions.snowball, penguin)) {
            hitPenguin(penguin);
            return;
        }
    }
            
    // Проверка выхода за границы
    if (positions.snowball.x < 0 || positions.snowball.x > canvas.width || 
        positions.snowball.y < 0 || positions.snowball.y > canvas.height) {
        positions.snowball.visible = false;
        gameState = 'waiting';
        drawGame();
        return;
    }
            
    drawGame();
    requestAnimationFrame(animateSnowball);
}
        
// Проверка столкновения
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}
        
// Попадание в пингвина
function hitPenguin(penguin) {
    positions.snowball.visible = false;
    penguin.state = 'hit';
            
    // Расчет траектории полета пингвина
    const targetX = positions.target.x + positions.target.width / 2;
    const targetY = positions.target.y + positions.target.height / 2;
            
    penguin.speedX = (targetX - penguin.x) / 20 + (Math.random() * 4 - 2);
    penguin.speedY = (targetY - penguin.y) / 20 + (Math.random() * 4 - 2);
            
    // Анимация полета пингвина
    animatePenguin(penguin);
}
        
// Анимация полета пингвина
function animatePenguin(penguin) {
    penguin.x += penguin.speedX;
    penguin.y += penguin.speedY;
            
    // Проверка попадания в мишень
    if (checkCollision(penguin, positions.target)) {
        calculateScore(penguin);
        return;
    }
            
    // Проверка выхода за границы
    if (penguin.x < -penguin.width || penguin.x > canvas.width || 
        penguin.y < -penguin.height || penguin.y > canvas.height) {
        penguin.state = 'missed';
        penguinMissed();
        return;
    }
            
    drawGame();
    requestAnimationFrame(() => animatePenguin(penguin));
}
        
// Расчет очков за попадание
function calculateScore(penguin) {
    penguin.state = 'scored';
            
    // Случайным образом выбираем количество очков из возможных значений
    const points = possiblePoints[Math.floor(Math.random() * possiblePoints.length)];
    penguin.points = points;
            
    // Добавление очков
    score += points;
    scoreDisplay.textContent = `Очки: ${score}`;
            
    // Показ всплывающего сообщения с очками
    showPointsPopup(points, penguin.x, penguin.y);
            
    // Уменьшение количества оставшихся пингвинов
    penguinsLeft--;
    penguinsLeftDisplay.textContent = `Пингвины: ${penguinsLeft}`;
            
    // Удаляем пингвина после задержки
    setTimeout(() => {
        const index = activePenguins.indexOf(penguin);
        if (index !== -1) {
            activePenguins.splice(index, 1);
        }
                
        // Проверка окончания игры
        if (penguinsLeft <= 0) {
            endGame();
        } else {
            // Создаем нового пингвина
            createPenguin();
            gameState = 'waiting';
        }
        drawGame();
    }, 1000); // Задержка перед удалением пингвина
            
    drawGame();
}
        
// Пингвин промахнулся мимо мишени
function penguinMissed() {
    // Удаляем промахнувшегося пингвина
    activePenguins = activePenguins.filter(p => p.state !== 'missed');
            
    // Уменьшение количества оставшихся пингвинов
    penguinsLeft--;
    penguinsLeftDisplay.textContent = `Пингвины: ${penguinsLeft}`;
            
    // Проверка окончания игры
    if (penguinsLeft <= 0) {
        endGame();
    } else {
        // Создаем нового пингвина
        createPenguin();
        gameState = 'waiting';
        drawGame();
    }
}
        
// Показать всплывающее сообщение с очками
function showPointsPopup(points, x, y) {
    pointsPopup.textContent = `+${points}`;
    pointsPopup.style.left = `${x}px`;
    pointsPopup.style.top = `${y}px`;
    pointsPopup.style.display = 'block';
            
    // Анимация всплывания
    let opacity = 1;
    let currentY = y;
    const animation = setInterval(() => {
        opacity -= 0.02;
        currentY -= 1;
        pointsPopup.style.opacity = opacity;
        pointsPopup.style.top = `${currentY}px`;
                
        if (opacity <= 0) {
            clearInterval(animation);
            pointsPopup.style.display = 'none';
        }
    }, 20);
}
        
// Окончание игры
function endGame() {
    gameState = 'gameOver';
    finalScoreDisplay.textContent = `Ваш счет: ${score}`;
    gameOver.style.display = 'block';
}
        
// Сохранение результата
function saveScore() {
    const name = nameInput.value.trim() || 'Игрок';
            
    highScores.push({
        name: name,
        score: score
    });
            
    localStorage.setItem('yetisportsHighScores', JSON.stringify(highScores));
    gameOver.style.display = 'none';
    showHighScores();
}
        
// Отрисовка игры
function drawGame() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
            
    // Фон
    if (images.background.complete) {
        ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    }
            
    // Айсберг
    if (images.iceberg.complete) {
        ctx.drawImage(images.iceberg, positions.iceberg.x, positions.iceberg.y, positions.iceberg.width, positions.iceberg.height);
    }
            
    // Касатка
    if (images.orca.complete) {
        ctx.drawImage(images.orca, positions.orca.x, positions.orca.y, positions.orca.width, positions.orca.height);
    }
            
    // Мишень
    if (images.target.complete) {
        ctx.drawImage(images.target, positions.target.x, positions.target.y, positions.target.width, positions.target.height);
    }
            
    // Йети
    if (images.yeti.complete) {
        ctx.drawImage(images.yeti, positions.yeti.x, positions.yeti.y, positions.yeti.width, positions.yeti.height);
    }
            
    // Пингвины
    if (images.penguin.complete) {
        for (const penguin of activePenguins) {
            ctx.drawImage(images.penguin, penguin.x, penguin.y, penguin.width, penguin.height);
                    
            // Отображаем очки для пингвинов, которые уже попали в мишень
            if (penguin.state === 'scored') {
                ctx.fillStyle = 'yellow';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(penguin.points.toString(), penguin.x + penguin.width / 2 - 10, penguin.y - 10);
            }
        }
    }
            
    // Снежок
    if (positions.snowball.visible && images.snowball.complete) {
        ctx.drawImage(images.snowball, positions.snowball.x, positions.snowball.y, positions.snowball.width, positions.snowball.height);
    }
}
        
// Запуск отрисовки при загрузке изображений
images.background.onload = drawGame;