"""Run with Playwright against a local server; never sends real email."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8766/stonehenge/'
OUT = Path('/Users/nikita/Desktop/united-stonehenge-evidence')

def fill(page):
    page.locator('[data-open=consultation]').click()
    page.locator('[name=goal]').select_option(label='Get fitter / stronger')
    page.locator('[name=name]').fill('UNITED delivery test')
    page.locator('[name=phone]').fill('+971 50 000 0000')
    page.locator('[name=preferred_time]').select_option(label='Evening')

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for width, height in [(768,1024),(820,1180),(1024,768),(1180,820),(390,844)]:
        page.set_viewport_size({'width':width,'height':height})
        page.goto(BASE)
        page.locator('#ivanPhoto').wait_for()
        assert page.locator('#ivanPhoto').evaluate('(e)=>e.complete && e.naturalWidth > 0')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(OUT/f'{width}x{height}-landing.png'), full_page=True)
        for kind in ['consultation','group','pt']:
            page.locator(f'[data-open={kind}]').click()
            assert page.locator('#leadDialog').is_visible()
            assert page.locator('#leadDialog').evaluate('(e)=>e.scrollWidth <= e.clientWidth')
            page.locator('.submit').scroll_into_view_if_needed()
            assert page.locator('.submit').is_visible()
            page.screenshot(path=str(OUT/f'{width}x{height}-{kind}.png'))
            page.locator('#closeDialog').click()
    page.goto(BASE)
    calls = []
    page.route('https://formsubmit.co/**', lambda route: calls.append(route.request.url))
    fill(page)
    page.locator('.submit').click()
    assert page.locator('#formError').is_visible()
    assert not page.locator('#successView').is_visible()
    assert not calls
    page.unroute('https://formsubmit.co/**')
    page.route('**/form-config.js', lambda route: route.fulfill(content_type='application/javascript', body="window.stonehengeFormConfig={endpoint:'https://formsubmit.co/ajax/ivan@joinunited.ae',cc:'julia@joinunited.ae',enabled:true};"))
    cases = [
        ('http-error', 503, {'success': True}),
        ('service-error', 200, {'success': 'false', 'message':'Rejected'}),
        ('activation', 200, {'success':'true','message':'Activate your email'}),
        ('invalid-json', 200, None),
        ('missing-success', 200, {'message':'OK'}),
        ('network-error', None, None),
        ('timeout', 'timeout', None),
        ('success-string', 200, {'success':'true','message':'Email sent successfully'}),
        ('success-boolean', 200, {'success':True}),
    ]
    for name, status, result in cases:
        payloads = []
        page.goto(BASE)
        if status == 'timeout':
            page.evaluate('window.fetch = (url, opts) => new Promise((resolve, reject) => opts.signal.addEventListener("abort", () => reject(new DOMException("Timeout", "AbortError")))); const original = window.setTimeout; window.setTimeout = (fn, ms) => original(fn, ms === 25000 ? 50 : ms)')
        else:
            def handle(route):
                payloads.append(json.loads(route.request.post_data))
                assert route.request.url == 'https://formsubmit.co/ajax/ivan@joinunited.ae'
                if status is None:
                    route.abort('failed')
                else:
                    route.fulfill(status=status,content_type='application/json',body=json.dumps(result) if result else 'bad json')
            page.route('https://formsubmit.co/**',handle)
        fill(page)
        page.locator('.submit').click()
        if name.startswith('success'):
            page.locator('#successView').wait_for(state='visible')
            assert not page.locator('#formError').is_visible()
        else:
            page.locator('#formError').wait_for(state='visible')
            assert not page.locator('#successView').is_visible()
            assert page.locator('[name=name]').input_value() == 'UNITED delivery test'
            assert page.locator('.submit').is_enabled()
            assert page.evaluate('localStorage.getItem("stonehenge1_leads")') is None
        if status != 'timeout':
            assert len(payloads) == 1, (name,payloads)
            assert payloads[0]['_cc'] == 'julia@joinunited.ae'
        page.unroute('https://formsubmit.co/**')
        print('PASS',name)
    assert not errors, errors
    print('PASS five viewport sizes, three form types, no overflow or JS errors')
    browser.close()
