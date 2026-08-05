#!/usr/bin/env bash
set +e
cd /home/z/my-project
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "chat-service/index" 2>/dev/null
sleep 1
: > dev.log
: > chat-service.log
(cd /home/z/my-project/mini-services/chat-service && setsid nohup bun run dev > /home/z/my-project/chat-service.log 2>&1 &)
sleep 1
setsid nohup ./node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
for i in $(seq 1 20); do
  sleep 2
  c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 http://127.0.0.1:3000/ 2>/dev/null)
  [ "$c" = "200" ] && { echo "[v3] ready ${i}x2s"; break; }
done

AB="agent-browser"
# Reuse alice session (cookie persisted) — open app
$AB --session alice open http://127.0.0.1:81/ 2>&1 | tail -1
$AB --session alice wait 3500 2>&1 | tail -1

echo "########## 1) Cloud Gaming — verify 8 games with cover images ##########"
$AB --session alice find role button click --name "Cloud Gaming" 2>&1 | tail -1
$AB --session alice wait 1500 2>&1 | tail -1
echo "--- game cards (expect 8) ---"
$AB --session alice snapshot 2>&1 | grep -iE "Neon Snake|2048|Breakout|Tetris|Pong Duel|Minesweeper|Memory Match|Void Invaders" | head -12
echo "--- cover images actually loaded? ---"
$AB --session alice eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src.includes('/covers/')).map(i=>({src:i.src.split('/').pop(), w:i.naturalWidth, h:i.naturalHeight}))" 2>&1 | tail -15

echo ""
echo "########## 2) Launch a NEW game (Pong) — verify playable ##########"
$AB --session alice find text "Pong Duel" click 2>&1 | tail -1
$AB --session alice wait 2500 2>&1 | tail -1
echo "--- iframe src ---"
$AB --session alice eval "document.querySelector('iframe') ? document.querySelector('iframe').src : 'NO IFRAME'" 2>&1 | tail -2

echo ""
echo "########## 3) Back to library, launch Minesweeper ##########"
$AB --session alice find text "Library" click 2>&1 | tail -1
$AB --session alice wait 800 2>&1 | tail -1
$AB --session alice find text "Minesweeper Grid" click 2>&1 | tail -1
$AB --session alice wait 2500 2>&1 | tail -1
$AB --session alice eval "document.querySelector('iframe') ? document.querySelector('iframe').src : 'NO IFRAME'" 2>&1 | tail -2

echo ""
echo "########## 4) Browser — proxy mode navigation ##########"
$AB --session alice find role button click --name "Browser" 2>&1 | tail -1
$AB --session alice wait 1500 2>&1 | tail -1
echo "--- browser snapshot (tabs, search engine, proxy toggle) ---"
$AB --session alice snapshot -i 2>&1 | head -20
echo "--- type a URL and go (proxy ON by default) ---"
$AB --session alice find placeholder "Search DuckDuckGo or enter address" fill "en.wikipedia.org/wiki/Cloud_gaming" 2>&1 | tail -1
$AB --session alice find placeholder "Search DuckDuckGo or enter address" click 2>&1 | tail -1
$AB --session alice press Enter 2>&1 | tail -1
$AB --session alice wait 5000 2>&1 | tail -1
echo "--- iframe src after proxy nav ---"
$AB --session alice eval "document.querySelector('iframe') ? document.querySelector('iframe').src.slice(0,80) : 'NO IFRAME'" 2>&1 | tail -2
echo "--- proxy fetch direct check ---"
curl -s -o /dev/null -w "proxy HTTP %{http_code} size=%{size_download}\n" --max-time 20 "http://127.0.0.1:3000/api/proxy?url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FCloud_gaming"

echo ""
echo "########## 5) Browser — bookmark a page ##########"
$AB --session alice wait 1000 2>&1 | tail -1
echo "--- click bookmark star ---"
$AB --session alice snapshot -i 2>&1 | grep -iE "Add bookmark|bookmark|Star" | head -5
# Try clicking the bookmark star via its role
$AB --session alice find role button click --name "Add bookmark" 2>&1 | tail -1
$AB --session alice wait 800 2>&1 | tail -1
echo "--- open new tab, check bookmark shows on new-tab page ---"
$AB --session alice snapshot -i 2>&1 | grep -iE "New tab|\\+" | head -3

echo ""
echo "########## 6) Console errors check ##########"
echo "--- alice page errors ---"
$AB --session alice errors 2>&1 | tail -15
echo "--- console (last 10) ---"
$AB --session alice console 2>&1 | tail -10

echo ""
echo "########## 7) Chat still works (regression) ##########"
$AB --session alice find role button click --name "Chat" 2>&1 | tail -1
$AB --session alice wait 2000 2>&1 | tail -1
$AB --session alice find placeholder "Message #general" fill "testing after browser+games update" 2>&1 | tail -1
$AB --session alice find placeholder "Message #general" click 2>&1 | tail -1
$AB --session alice press Enter 2>&1 | tail -1
$AB --session alice wait 1500 2>&1 | tail -1
$AB --session alice snapshot 2>&1 | grep -iE "testing after browser" | head -3

echo ""
echo "########## 8) dev.log + chat log ##########"
tail -8 /home/z/my-project/dev.log
echo "--- chat ---"
tail -5 /home/z/my-project/chat-service.log

echo ""
echo "[v3] DONE"
