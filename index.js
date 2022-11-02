const { Telegraf, Markup } = require("telegraf");
const dotenv = require("dotenv").config();
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

setInterval(async () => {
  try {
    console.log("Отправил запрос");
    const { data } = await axios.get("https://flatsbot1.herokuapp.com/flats/");
    const { data: users } = await axios.get("https://flatsbot1.herokuapp.com/users/all");

    console.log("получил ответ");

    if (data.length) {
      for (let flat of data) {
        let photos = flat.photos;
        let photosToSend = [];
        console.log(flat);
        const str = `
${flat.title}
Цена: ${flat.price}
Площадь: ${flat.space}
Количество комнат: ${flat.rooms}
Лоцакия: ${flat.location}

<a href="${flat.link}">Посмотреть подробнее</a>
            `;

        photos.forEach((photo, idx) => {
          if (idx === 0) {
            photosToSend.push({
              type: "photo",
              media: photo,
              caption: str,
              parse_mode: 'HTML'
            });
          } else {
            photosToSend.push({
              type: "photo",
              media: photo,
            });
          }

          
        });

        if (photosToSend.length > 10) {
          photosToSend.length = 10;
        }

        console.log(photosToSend);

        for (let user of users) {
          await bot.telegram.sendMediaGroup(user.tg_id, photosToSend, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Открыть объявление",
                    url: flat.link,
                  },
                ],
              ],
            },
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}, 60000);

bot.start(async (ctx) => {
  try {
    const { data } = await axios.post(
      "https://flatsbot1.herokuapp.com/users/registration",
      { id: ctx.from.id }
    );

    if (data?.isUserWasSaved) {
      return ctx.reply(
        "Вы уже зарегистрированы!",
        Markup.keyboard([["Вкл/выкл оповещения"], ["Мой профиль"]]).resize()
      );
    }

    if (data) {
      return ctx.reply(
        "Вы успешно зарегистрировались в боте! При появлении новых объявлений квартир бот оповестит вас!",
        Markup.keyboard([["Вкл/выкл оповещения"], ["Мой профиль"]]).resize()
      );
    }
  } catch (error) {
    console.log(error);
    return ctx.reply(
      "Не получилось зарегистрироваться в боте!",
      Markup.keyboard([["Вкл/выкл оповещения"], ["Мой профиль"]]).resize()
    );
  }
});

bot.hears("Мой профиль", async (ctx) => {
  try {
    const { data } = await axios.get(
      "https://flatsbot1.herokuapp.com/users/me/" + ctx.from.id
    );

    ctx.replyWithHTML(`
Ваш ID: <code>${data.tg_id}</code> ❣️    
Уведомления: ${data.push ? "включены 🔉" : "выключены 🔇"}
Дата регистрации: <strong>${new Date(
      data.createdAt
    ).toLocaleDateString()}</strong> 🕑   
    `);
  } catch (error) {
    ctx.reply("Произошла ошибка, мы не нашли вас в базе данных");
  }
});

bot.hears("Вкл/выкл оповещения", async (ctx) => {
  try {
    const { data } = await axios.patch(
      "https://flatsbot1.herokuapp.com/users/me/" + ctx.from.id
    );

    ctx.replyWithHTML(
      `Уведомления о новых объявлениях ${
        data.push ? "включены 🔉" : "выключены 🔇"
      }`
    );
  } catch (error) {
    ctx.reply("Произошла ошибка, мы не нашли вас в базе данных");
  }
});
bot.launch();
