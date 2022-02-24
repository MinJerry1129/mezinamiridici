const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');
const logger = require('./logging');
require('./path_env');

const COMPILED_TEMPLATES = {};

let transporter;

async function sendEmail(config, options, context) {
  if (transporter === undefined) {
    switch (process.env.MAILER) {
      case 'SES':
        transporter = await createAWSSESTransporter();
        break;
      case 'SMTP':
      case 'FAKE':
      default:
        transporter = await createFakeTransporter();
    }
  }

  const filepath = path.resolve(process.env.TEMPLATE_DIRECTORY, config);
  const emailConfig = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const data = Object.assign({}, emailConfig, options);
  data.from = process.env.DEFAULT_SENDER;
  if (emailConfig.text_template) {
    data.text = processTemplate(config, emailConfig.text_template, context);
    delete emailConfig.text_template;
  }
  if (emailConfig.html_template) {
    data.html = processTemplate(config, emailConfig.html_template, context);
    delete emailConfig.html_template;
  }

  const info = await transporter.sendMail(data);
  logger.debug(`Message sent: ${info.messageId}`);
  const testMessageUrl = nodemailer.getTestMessageUrl(info);
  if (testMessageUrl) {
    logger.debug(`Preview URL: ${testMessageUrl}`);
  }
  return info;
}

function processTemplate(templateName, filename, context) {
  let compiled = COMPILED_TEMPLATES[`${templateName}.${filename}`];
  if (!compiled) {
    const filepath = path.resolve(process.env.TEMPLATE_DIRECTORY, filename);
    const template = fs.readFileSync(filepath, 'utf8');
    compiled = Handlebars.compile(template);
    COMPILED_TEMPLATES[`${templateName}.${filename}`] = compiled;
  }

  return compiled(context);
}

async function createFakeTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  // create reusable transporter object using the default SMTP transport
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
}

async function createAWSSESTransporter() {
  // eslint-disable-next-line global-require
  const AWS = require('aws-sdk');
  AWS.config.region = process.env.AWS_REGION;
  return nodemailer.createTransport({
    SES: new AWS.SES({
      apiVersion: '2010-12-01',
    }),
  });
}

exports.sendEmail = sendEmail;
