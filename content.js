//@ts-check
/// <reference types="web-ext-types"/>


const categoryEmoji = {
  'Smileys & Emotion': '😀',
  'People & Body': '🤦‍♀️'

}


let mouseLoc = { x: 0, y: 0 }

// Get mouse position (There needs to be a better way that is optimized for performance)
document.addEventListener('mousemove', function (e) {
    mouseLoc.x = e.clientX
    mouseLoc.y = e.clientY
})

// =============================================================================
// Main function

function setTab(activeTab, activeTabIdentifier) {
  const allTabContents = document.querySelectorAll('.fep-tab-cont')
  // @ts-ignore
  allTabContents.forEach((el) => (el.style.display = 'none'))
  document.getElementById(activeTab).style.display = 'block'

  const allTabIdents = document.querySelectorAll('.fep-tab')
  allTabContents.forEach((el) => (el.classList.remove('feb-active'), el.classList.add('feb-inactive')))
  document.getElementById(activeTabIdentifier).classList.add('feb-active')
}

async function popup(x, y) {
  console.log(
    '%cEmoji picker content script',
    'font-size: 20px; text-decoration: underline;'
  )

  const data = await (
    await fetch(browser.runtime.getURL('window/emoji.json'))
  ).json()

  const catagories = data
    .map(({ category }) => category)
    .filter((v, i, a) => a.indexOf(v) === i)

  const tabs = catagories.map((category) => {
    const id = categoryId(category)

    const tabElId = `fep-tab-${id}`
    const tabContId = `fep-tab-cont-${id}`

    const tabEl = html`<button class="fep-tab" id="${tabElId}">${categoryEmoji[category]}</button>`

    const tabCont = html`<div
      class="fep-tab-cont fep-items"
      id="${tabContId}"
      style="display: none;"
    >
      ${data
        .filter((cat) => cat.category == category)
        .map(
          ({ emoji, name }) =>
            html`<button class="fep-item">${emoji}</button>`
        )
        .map((item) => item.outerHTML)
        .join('')}
    </div>`

    tabEl.addEventListener('click', () => {
      setTab(tabContId, tabElId)
    })

    return { tabEl, tabCont }
  })

  //Injection Lol
  const popup = html` <div
    class="fep-container"
    id="fep-container"
    style="position: absolute; top: ${y}px; left: ${x}px; z-index: 99999999;"
  >
    <input
      class="fep-input-search"
      id="fep-input-search"
      placeholder="🔍 Search for emojis by category or tag"
    />
    <!-- The tabs used for controling stuff -->
    <div class="fep-tabs" id="fep-tabs">  
    
    </div>
    <hr>
    <div id="fep-search-results" class="fep-tabs"></div>

    <!-- <div class="fep-items" id="fep-items"></div> -->
  </div>`

  document.body.append(popup)

  document.getElementById('fep-tabs').append(...tabs.map(({ tabEl }) => tabEl))
  document.getElementById('fep-container').append(...tabs.map(({ tabCont }) => tabCont))

  // @ts-ignore
  setTimeout(() => document.getElementById('fep-tabs').children[0].click(), 50)

  document.getElementById('fep-input-search').addEventListener('keyup', e => {
      const value = e.target.value
      const out = document.getElementById('fep-search-results')
      for (const child of out.children) {
        child.remove()
      }

      out.append(...data.filter(({description}) => description.includes(value)))
  })
}

browser.runtime.onMessage.addListener(async msg => {
  if (document.getElementById('fep-container')) {
    document.getElementById('fep-container').remove()
  } else {
    const css = await (
      await fetch(browser.runtime.getURL('window/style.css'))
    ).text()
    document.head.appendChild(
      html`<style>
        ${css}
      </style>`
    )
  }

  popup(mouseLoc.x, mouseLoc.y)
})

// =============================================================================
// Utility functions

/**
 * @param {string} name
 */
function categoryId(name) {
  return name
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const html = (h, ...values) => {
  const wrapper = document.createElement('div')

  wrapper.innerHTML = h
    .reduce((result, s, i) => result + s + (values[i] ? values[i] : ''), '')
    .replace('\t', '')

  if (wrapper.childElementCount != 1)
    throw new Error("HTML can't have more or less than one root node.")

  return wrapper.children[0]
}

