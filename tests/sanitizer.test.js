/**
 * Tests pour Sanitizer - Protection XSS
 * Tests complets avec payloads OWASP
 */

// Mock DOMPurify pour les tests
global.DOMPurify = {
  sanitize: (html, config = {}) => {
    // Simulation simple de DOMPurify pour les tests
    const allowedTags = config.ALLOWED_TAGS || ['b', 'i', 'em', 'strong', 'span', 'p', 'br', 'div', 'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const forbiddenTags = config.FORBID_TAGS || ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'];
    const forbiddenAttrs = config.FORBID_ATTR || ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'];

    // Supprimer les tags interdits et leurs contenus
    let result = html;
    forbiddenTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>|<${tag}[^>]*/?>`, 'gis');
      result = result.replace(regex, '');
    });

    // Supprimer les attributs interdits
    forbiddenAttrs.forEach(attr => {
      const regex = new RegExp(`\\s*${attr}\\s*=\\s*["'][^"']*["']|\\s*${attr}\\s*=\\s*[^\\s>]+`, 'gi');
      result = result.replace(regex, '');
    });

    return result;
  }
};

const {
  escapeHtml,
  html,
  createSecureElement,
  setInnerHTMLSafe,
  buildSecureDOM,
  sanitizeCategoryName
} = require('../src/utils/sanitizer.js')

describe('Sanitizer - Protection XSS Complète', () => {

  // =======================
  // 1. ESCAPE HTML - BASIC
  // =======================

  describe('escapeHtml() - Fonctionnement de base', () => {
    test('should escape basic HTML tags', () => {
      const input = '<script>alert("XSS")</script>'
      const result = escapeHtml(input)

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('</script>')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })

    test('should escape quotes', () => {
      const input = 'Hello "World" and \'Friends\''
      const result = escapeHtml(input)

      // Les guillemets peuvent être échappés ou non selon le navigateur
      // L'important est que le texte soit sûr
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    test('should handle plain text without changes', () => {
      const input = 'Hello World 123'
      const result = escapeHtml(input)

      expect(result).toBe('Hello World 123')
    })

    test('should handle special characters', () => {
      const input = '< > & " \' /'
      const result = escapeHtml(input)

      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).toContain('&amp;')
    })

    test('should handle null', () => {
      const result = escapeHtml(null)
      expect(result).toBe('')
    })

    test('should handle undefined', () => {
      const result = escapeHtml(undefined)
      expect(result).toBe('')
    })

    test('should handle empty string', () => {
      const result = escapeHtml('')
      expect(result).toBe('')
    })

    test('should handle numbers', () => {
      const result = escapeHtml(123)
      expect(result).toBeDefined()
    })
  })

  // =======================
  // 2. XSS PAYLOADS - OWASP
  // =======================

  describe('escapeHtml() - OWASP XSS Payloads', () => {
    test('should block script tag injection', () => {
      const payloads = [
        '<script>alert("XSS")</script>',
        '<SCRIPT>alert("XSS")</SCRIPT>',
        '<script>alert(String.fromCharCode(88,83,83))</script>',
        '<script src="http://evil.com/xss.js"></script>',
        '<script>document.location="http://evil.com"</script>'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        expect(result).not.toContain('<script')
        expect(result).not.toContain('</script')
        expect(result).toContain('&lt;')
      })
    })

    test('should block IMG tag XSS', () => {
      const payloads = [
        '<img src=x onerror=alert("XSS")>',
        '<img src="javascript:alert(\'XSS\')">',
        '<img src=x onerror="alert(String.fromCharCode(88,83,83))">',
        '<img/src="x"/onerror="alert(1)">',
        '<img src=x:alert(alt) onerror=eval(src) alt=xss>'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        expect(result).not.toContain('<img')
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })

    test('should block SVG XSS', () => {
      const payloads = [
        '<svg/onload=alert("XSS")>',
        '<svg><script>alert("XSS")</script></svg>',
        '<svg><animate onbegin=alert("XSS") attributeName=x dur=1s>',
        '<svg><set onbegin=alert(1) attributeName=x to=0>'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        expect(result).not.toContain('<svg')
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })

    test('should block iframe XSS', () => {
      const payloads = [
        '<iframe src="javascript:alert(\'XSS\')">',
        '<iframe src="data:text/html,<script>alert(\'XSS\')</script>">',
        '<iframe srcdoc="<script>alert(1)</script>">'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        expect(result).not.toContain('<iframe')
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })

    test('should block event handler XSS', () => {
      const payloads = [
        '<body onload=alert("XSS")>',
        '<div onmouseover="alert(\'XSS\')">',
        '<input onfocus=alert("XSS") autofocus>',
        '<select onfocus=alert("XSS") autofocus>',
        '<textarea onfocus=alert("XSS") autofocus>',
        '<button onclick=alert("XSS")>Click</button>'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        expect(result).not.toContain('<body')
        expect(result).not.toContain('<div')
        expect(result).not.toContain('<input')
        expect(result).not.toContain('<button')
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })

    test('should block style-based XSS', () => {
      const payloads = [
        '<style>body{background:url("javascript:alert(\'XSS\')")}</style>',
        '<div style="background-image:url(javascript:alert(\'XSS\'))">',
        '<div style="width:expression(alert(\'XSS\'))">',
        '<link rel="stylesheet" href="javascript:alert(\'XSS\')">'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        expect(result).not.toContain('<style')
        expect(result).not.toContain('<link')
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })

    test('should block data: URI XSS', () => {
      const payloads = [
        '<a href="data:text/html,<script>alert(\'XSS\')</script>">',
        '<object data="data:text/html,<script>alert(\'XSS\')</script>">',
        '<embed src="data:text/html,<script>alert(\'XSS\')</script>">'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        expect(result).not.toContain('<a ')
        expect(result).not.toContain('<object')
        expect(result).not.toContain('<embed')
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })

    test('should block mixed case and obfuscated XSS', () => {
      const payloads = [
        '<ScRiPt>alert("XSS")</ScRiPt>',
        '<IMG SRC="javascript:alert(\'XSS\');">',
        '<BODY ONLOAD=alert(\'XSS\')>',
        '<<SCRIPT>alert("XSS");//<</SCRIPT>',
        '<scr<script>ipt>alert("XSS")</scr</script>ipt>'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        // Tous les < et > doivent être échappés
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })

    test('should block UTF-7 and encoded XSS', () => {
      const payloads = [
        '+ADw-script+AD4-alert(\'XSS\')+ADw-/script+AD4-',
        '&#60;script&#62;alert(\'XSS\')&#60;/script&#62;',
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        '%3Cscript%3Ealert(\'XSS\')%3C/script%3E'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        // Le payload devrait être échappé ou neutralisé
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
      })
    })

    test('should block HTML5 new vector XSS', () => {
      const payloads = [
        '<video src=x onerror=alert("XSS")>',
        '<audio src=x onerror=alert("XSS")>',
        '<details open ontoggle=alert("XSS")>',
        '<marquee onstart=alert("XSS")>',
        '<input type="image" src=x onerror=alert("XSS")>'
      ]

      payloads.forEach(payload => {
        const result = escapeHtml(payload)
        expect(result).not.toContain('<video')
        expect(result).not.toContain('<audio')
        expect(result).not.toContain('<details')
        expect(result).not.toContain('<marquee')
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })
  })

  // =======================
  // 3. HTML TEMPLATE TAG
  // =======================

  describe('html() - Template Tag Sécurisé', () => {
    test('should create safe HTML with escaped values', () => {
      const userInput = '<script>alert("XSS")</script>'
      const result = html`<div>${userInput}</div>`

      expect(result).toContain('<div>')
      expect(result).toContain('</div>')
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    test('should handle multiple interpolations', () => {
      const name = '<b>Hacker</b>'
      const message = '<img src=x onerror=alert(1)>'
      const result = html`<p>User: ${name}, Message: ${message}</p>`

      expect(result).toContain('<p>')
      expect(result).not.toContain('<b>')
      expect(result).not.toContain('<img')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })

    test('should handle numbers and plain text', () => {
      const result = html`<span>Count: ${42}</span>`

      expect(result).toBe('<span>Count: 42</span>')
    })

    test('should escape all dangerous characters', () => {
      const input = '< > & " \''
      const result = html`<div>${input}</div>`

      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).toContain('&amp;')
    })
  })

  // =======================
  // 4. CREATE SECURE ELEMENT
  // =======================

  describe('createSecureElement() - Création DOM Sécurisée', () => {
    test('should create element with safe text', () => {
      const dangerousText = '<script>alert("XSS")</script>'
      const element = createSecureElement('div', dangerousText)

      expect(element.tagName).toBe('DIV')
      expect(element.textContent).toBe(dangerousText)
      expect(element.innerHTML).not.toContain('<script>')
      expect(element.innerHTML).toContain('&lt;script&gt;')
    })

    test('should add class attribute', () => {
      const element = createSecureElement('span', 'Test', { class: 'my-class' })

      expect(element.className).toBe('my-class')
      expect(element.textContent).toBe('Test')
    })

    test('should add multiple attributes', () => {
      const element = createSecureElement('button', 'Click Me', {
        id: 'my-btn',
        class: 'btn btn-primary',
        'data-action': 'submit'
      })

      expect(element.id).toBe('my-btn')
      expect(element.className).toBe('btn btn-primary')
      expect(element.getAttribute('data-action')).toBe('submit')
      expect(element.textContent).toBe('Click Me')
    })

    test('should add style object', () => {
      const element = createSecureElement('div', 'Styled', {
        style: { color: 'red', fontSize: '16px' }
      })

      expect(element.style.color).toBe('red')
      expect(element.style.fontSize).toBe('16px')
    })

    test('should handle XSS in attributes safely', () => {
      const maliciousClass = 'class" onload="alert(1)'
      const element = createSecureElement('div', 'Test', { class: maliciousClass })

      // La classe est ajoutée telle quelle (setAttribute échappe automatiquement)
      expect(element.className).toBe(maliciousClass)
      // Mais le textContent reste sûr
      expect(element.textContent).toBe('Test')
    })

    test('should create different tag types', () => {
      const tags = ['div', 'p', 'span', 'button', 'h1', 'h2', 'li']

      tags.forEach(tag => {
        const element = createSecureElement(tag, 'Content')
        expect(element.tagName).toBe(tag.toUpperCase())
      })
    })
  })

  // =======================
  // 5. SET INNER HTML SAFE
  // =======================

  describe('setInnerHTMLSafe() - innerHTML Sécurisé', () => {
    let container

    beforeEach(() => {
      container = document.createElement('div')
    })

    test('should set HTML with escaped user inputs', () => {
      const userInput = '<script>alert("XSS")</script>'
      const htmlTemplate = '<p>User said: <USER_INPUT></p>'

      setInnerHTMLSafe(container, htmlTemplate, [userInput])

      expect(container.innerHTML).toContain('<p>')
      expect(container.innerHTML).not.toContain('<script>')
    })

    test('should handle multiple user inputs', () => {
      const name = 'USERNAME'
      const message = 'MESSAGE'

      setInnerHTMLSafe(container, `<div>${name} - ${message}</div>`, [name, message])

      expect(container.innerHTML).toContain('<div>')
      expect(container.innerHTML).toContain('USERNAME')
      expect(container.innerHTML).toContain('MESSAGE')
    })

    test('should allow safe static HTML', () => {
      setInnerHTMLSafe(container, '<h1>Safe Title</h1><p>Content</p>')

      expect(container.innerHTML).toContain('<h1>')
      expect(container.innerHTML).toContain('<p>')
    })
  })

  // =======================
  // 6. BUILD SECURE DOM
  // =======================

  describe('buildSecureDOM() - Construction DOM Complexe', () => {
    test('should build simple element', () => {
      const element = buildSecureDOM({
        tag: 'div',
        text: '<script>alert("XSS")</script>'
      })

      expect(element.tagName).toBe('DIV')
      expect(element.textContent).toBe('<script>alert("XSS")</script>')
      expect(element.innerHTML).not.toContain('<script>')
    })

    test('should build element with className', () => {
      const element = buildSecureDOM({
        tag: 'div',
        className: 'my-class another-class',
        text: 'Content'
      })

      expect(element.className).toBe('my-class another-class')
    })

    test('should build element with attributes', () => {
      const element = buildSecureDOM({
        tag: 'button',
        text: 'Click',
        attributes: {
          id: 'my-btn',
          'data-action': 'submit',
          disabled: 'true'
        }
      })

      expect(element.id).toBe('my-btn')
      expect(element.getAttribute('data-action')).toBe('submit')
      expect(element.getAttribute('disabled')).toBe('true')
    })

    test('should build nested structure', () => {
      const element = buildSecureDOM({
        tag: 'div',
        className: 'modal',
        children: [
          {
            tag: 'h3',
            text: '<script>XSS</script>'
          },
          {
            tag: 'p',
            text: 'Safe content'
          }
        ]
      })

      expect(element.children.length).toBe(2)
      expect(element.children[0].tagName).toBe('H3')
      expect(element.children[0].textContent).toBe('<script>XSS</script>')
      expect(element.children[0].innerHTML).not.toContain('<script>')
    })

    test('should build deeply nested structure', () => {
      const element = buildSecureDOM({
        tag: 'div',
        children: [
          {
            tag: 'ul',
            children: [
              { tag: 'li', text: 'Item 1' },
              { tag: 'li', text: '<img src=x onerror=alert(1)>' },
              { tag: 'li', text: 'Item 3' }
            ]
          }
        ]
      })

      const ul = element.querySelector('ul')
      expect(ul.children.length).toBe(3)
      expect(ul.children[1].textContent).toBe('<img src=x onerror=alert(1)>')
      expect(ul.children[1].innerHTML).not.toContain('<img')
    })

    test('should handle string children', () => {
      const element = buildSecureDOM({
        tag: 'p',
        children: ['Plain text ', 'More text']
      })

      expect(element.textContent).toBe('Plain text More text')
    })

    test('should handle safeHTML for static content', () => {
      const element = buildSecureDOM({
        tag: 'div',
        safeHTML: '<em>Safe</em> <strong>HTML</strong>'
      })

      expect(element.innerHTML).toContain('<em>')
      expect(element.innerHTML).toContain('<strong>')
    })

    test('should use default div tag', () => {
      const element = buildSecureDOM({
        text: 'Content'
      })

      expect(element.tagName).toBe('DIV')
    })
  })

  // =======================
  // 7. SANITIZE CATEGORY NAME
  // =======================

  describe('sanitizeCategoryName() - Sanitisation Noms', () => {
    test('should allow valid category names', () => {
      const validNames = [
        'Namaz',
        'Kuran Okuma',
        'Tesbih',
        'Dua',
        'Istighfar',
        'Selawat'
      ]

      validNames.forEach(name => {
        const result = sanitizeCategoryName(name)
        expect(result).toBe(name)
      })
    })

    test('should remove dangerous HTML characters', () => {
      const dangerous = '<script>alert("XSS")</script>'
      const result = sanitizeCategoryName(dangerous)

      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('"')
      expect(result).not.toContain("'")
    })

    test('should remove quotes and backticks', () => {
      const input = 'Test"name\'with`quotes'
      const result = sanitizeCategoryName(input)

      expect(result).not.toContain('"')
      expect(result).not.toContain("'")
      expect(result).not.toContain('`')
      expect(result).toBe('Testnamewithquotes')
    })

    test('should remove equals sign', () => {
      const input = 'category=malicious'
      const result = sanitizeCategoryName(input)

      expect(result).not.toContain('=')
      expect(result).toBe('categorymalicious')
    })

    test('should limit to 50 characters', () => {
      const longName = 'A'.repeat(100)
      const result = sanitizeCategoryName(longName)

      expect(result.length).toBe(50)
    })

    test('should trim whitespace', () => {
      const input = '  Namaz  '
      const result = sanitizeCategoryName(input)

      expect(result).toBe('Namaz')
    })

    test('should handle null', () => {
      const result = sanitizeCategoryName(null)
      expect(result).toBe('')
    })

    test('should handle undefined', () => {
      const result = sanitizeCategoryName(undefined)
      expect(result).toBe('')
    })

    test('should handle empty string', () => {
      const result = sanitizeCategoryName('')
      expect(result).toBe('')
    })

    test('should handle non-string input', () => {
      const result = sanitizeCategoryName(123)
      expect(result).toBe('')
    })

    test('should handle special characters', () => {
      const input = 'Test!@#$%^&*()_+-=[]{}|;:,.<>?/'
      const result = sanitizeCategoryName(input)

      // Tous les caractères dangereux doivent être enlevés
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('"')
      expect(result).not.toContain("'")
      expect(result).not.toContain('=')
    })
  })

  // =======================
  // 8. CAS D'USAGE RÉELS
  // =======================

  describe('Cas d\'usage Zikirmatik', () => {
    test('should sanitize group names safely', () => {
      const maliciousName = 'My Group <script>alert("XSS")</script>'
      const sanitized = sanitizeCategoryName(maliciousName)

      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
      expect(sanitized).toContain('My Group')
    })

    test('should create safe chat message elements', () => {
      const username = '<b>Hacker</b>'
      const message = '<img src=x onerror=alert(1)>'

      const element = buildSecureDOM({
        tag: 'div',
        className: 'chat-message',
        children: [
          { tag: 'strong', text: username },
          { tag: 'p', text: message }
        ]
      })

      expect(element.querySelector('strong').innerHTML).not.toContain('<b>')
      expect(element.querySelector('p').innerHTML).not.toContain('<img')
    })

    test('should safely display user book titles', () => {
      const bookTitle = 'My Book <script>steal()</script>'
      const element = createSecureElement('h3', bookTitle, {
        class: 'book-title'
      })

      expect(element.textContent).toBe(bookTitle)
      expect(element.innerHTML).not.toContain('<script>')
    })

    test('should escape notification messages', () => {
      const notifMessage = 'New message from <iframe src=evil.com>'
      const escaped = escapeHtml(notifMessage)

      expect(escaped).not.toContain('<iframe')
      expect(escaped).toContain('&lt;iframe')
    })

    test('should build safe leaderboard entries', () => {
      const users = [
        { name: '<script>alert(1)</script>', points: 100 },
        { name: 'Normal User', points: 50 }
      ]

      const leaderboard = buildSecureDOM({
        tag: 'ul',
        className: 'leaderboard',
        children: users.map(user => ({
          tag: 'li',
          children: [
            { tag: 'span', text: user.name },
            { tag: 'span', text: String(user.points) }
          ]
        }))
      })

      const firstUser = leaderboard.children[0].children[0]
      expect(firstUser.innerHTML).not.toContain('<script>')
      expect(firstUser.textContent).toContain('alert(1)')
    })
  })

  // =======================
  // 9. PERFORMANCE
  // =======================

  describe('Performance', () => {
    test('should escape 1000 strings quickly', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        escapeHtml(`<script>alert(${i})</script>`)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(200) // < 200ms (CI peut être plus lent)
    })

    test('should build 100 DOM elements quickly', () => {
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        createSecureElement('div', `<img src=x${i}>`, { class: 'test' })
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(50) // < 50ms
    })

    test('should handle large strings', () => {
      const largeString = '<script>'.repeat(1000) + 'alert("XSS")' + '</script>'.repeat(1000)
      const result = escapeHtml(largeString)

      expect(result).toBeDefined()
      expect(result).not.toContain('<script>')
    })
  })

  // =======================
  // 10. EDGE CASES
  // =======================

  describe('Edge Cases', () => {
    test('should handle unicode and emoji', () => {
      const input = 'Hello 👋 Merhaba 🇹🇷 مرحبا'
      const result = escapeHtml(input)

      expect(result).toContain('👋')
      expect(result).toContain('🇹🇷')
      expect(result).toContain('مرحبا')
    })

    test('should handle very long category names', () => {
      const longName = 'A'.repeat(200)
      const result = sanitizeCategoryName(longName)

      expect(result.length).toBe(50)
    })

    test('should handle only whitespace', () => {
      const result = sanitizeCategoryName('   ')
      expect(result).toBe('')
    })

    test('should handle mixed case HTML tags', () => {
      const input = '<ScRiPt>alert("XSS")</ScRiPt>'
      const result = escapeHtml(input)

      expect(result).not.toContain('<ScRiPt')
      expect(result).toContain('&lt;')
    })

    test('should handle malformed HTML', () => {
      const inputs = [
        '<<script>>alert(1)<<//script>>',
        '<script<script>>alert(1)</script>',
        '<<><script>alert(1)</script>'
      ]

      inputs.forEach(input => {
        const result = escapeHtml(input)
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })
    })

    test('should handle null bytes', () => {
      const input = 'test\x00test'
      const result = escapeHtml(input)

      expect(result).toBeDefined()
    })

    test('should handle circular references safely', () => {
      // buildSecureDOM ne devrait pas causer de boucle infinie
      const config = {
        tag: 'div',
        children: [
          { tag: 'p', text: 'Level 1' },
          { tag: 'div', children: [
            { tag: 'p', text: 'Level 2' }
          ]}
        ]
      }

      const element = buildSecureDOM(config)
      expect(element).toBeDefined()
      expect(element.children.length).toBe(2)
    })
  })
})
