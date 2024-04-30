function onErrorCallback(err) {
  console.log({ err })
}
async function createOrderCallback() {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // use the "body" param to optionally pass additional order information
      // like product ids and quantities
      body: JSON.stringify({
        cart: [
          {
            id: 'YOUR_PRODUCT_ID',
            quantity: 'YOUR_PRODUCT_QUANTITY',
          },
        ],
      }),
    })

    const orderData = await response.json()

    if (orderData.id) {
      return orderData.id
    } else {
      const errorDetail = orderData?.details?.[0]
      const errorMessage = errorDetail
        ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
        : JSON.stringify(orderData)

      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(error)
    resultMessage(`Could not initiate PayPal Checkout...<br><br>${error}`)
  }
}

async function onApproveCallback(data, actions) {
  try {
    const response = await fetch(`/api/orders/${data.orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const orderData = await response.json()
    // Three cases to handle:
    //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
    //   (2) Other non-recoverable errors -> Show a failure message
    //   (3) Successful transaction -> Show confirmation or thank you message

    const transaction =
      orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
      orderData?.purchase_units?.[0]?.payments?.authorizations?.[0]
    const errorDetail = orderData?.details?.[0]

    // this actions.restart() behavior only applies to the Buttons component
    if (errorDetail?.issue === 'INSTRUMENT_DECLINED' && !data.card && actions) {
      // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
      // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
      return actions.restart()
    } else if (
      errorDetail ||
      !transaction ||
      transaction.status === 'DECLINED'
    ) {
      // (2) Other non-recoverable errors -> Show a failure message
      let errorMessage
      if (transaction) {
        errorMessage = `Transaction ${transaction.status}: ${transaction.id}`
      } else if (errorDetail) {
        errorMessage = `${errorDetail.description} (${orderData.debug_id})`
      } else {
        errorMessage = JSON.stringify(orderData)
      }

      throw new Error(errorMessage)
    } else {
      // (3) Successful transaction -> Show confirmation or thank you message
      // Or go to another URL:  actions.redirect('thank_you.html');
      resultMessage(
        `Transaction ${transaction.status}: ${transaction.id}<br><br>See console for all available details`
      )
      console.log(
        'Capture result',
        orderData,
        JSON.stringify(orderData, null, 2)
      )
    }
  } catch (error) {
    console.error(error)
    resultMessage(
      `Sorry, your transaction could not be processed...<br><br>${error}`
    )
  }
}

const cardField = window.paypal.CardFields({
  createOrder: createOrderCallback,
  onApprove: onApproveCallback,
  onError: onErrorCallback,
})

let nameField
let numberField
let cvvField
let expiryField

// Render each field after checking for eligibility
if (cardField.isEligible()) {
  nameField = cardField.NameField()
  nameField.render('#card-name-field-container')

  numberField = cardField.NumberField()
  numberField.render('#card-number-field-container')

  cvvField = cardField.CVVField()
  cvvField.render('#card-cvv-field-container')

  expiryField = cardField.ExpiryField()
  expiryField.render('#card-expiry-field-container')

  // Add click listener to submit button and call the submit function on the CardField component
  document
    .getElementById('multi-card-field-button')
    .addEventListener('click', () => {
      cardField.submit().catch((error) => {
        resultMessage(
          `Sorry, your transaction could not be processed...<br><br>${error}`
        )
      })
    })
} else {
  // Hides card fields if the merchant isn't eligible
  document.querySelector('#card-form').style = 'display: none'
}

// Example function to show a result to the user. Your site's UI library can be used instead.
function resultMessage(message) {
  const container = document.querySelector('#result-message')
  container.innerHTML = message
}

function getState() {
  cardField.getState().then((response) => console.log(response))
}

let cardField2

function getState22() {
  cardField2
    .getState()
    .then((response) => console.log(response))
    .catch((err) => console.log(err))
}
async function getState2() {
  await nameField.close()
  await numberField.close()
  await cvvField.close()
  await expiryField.close()

  cardField2 = window.paypal.CardFields({
    createOrder: createOrderCallback,
    onApprove: onApproveCallback,
    onError: onErrorCallback,
  })
  if (cardField2.isEligible()) {
    const nameField = cardField2.NameField()
    nameField.render('#card-name-field-container')

    const numberField = cardField2.NumberField()
    numberField.render('#card-number-field-container')

    const cvvField = cardField2.CVVField()
    cvvField.render('#card-cvv-field-container')

    const expiryField = cardField2.ExpiryField()
    expiryField.render('#card-expiry-field-container')

    // Add click listener to submit button and call the submit function on the CardField component
    document
      .getElementById('multi-card-field-button')
      .addEventListener('click', () => {
        cardField2.submit().catch((error) => {
          resultMessage(
            `Sorry, your transaction could not be processed...<br><br>${error}`
          )
        })
      })
  } else {
    // Hides card fields if the merchant isn't eligible
    document.querySelector('#card-form').style = 'display: none'
  }
}
