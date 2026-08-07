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
  [ "$c" = "200" ] && { echo "[v2] ready ${i}x2s"; break; }
done

AB="agent-browser"
# alice session still has the auth cookie from before; reload to restore
$AB --session alice open http://127.0.0.1:81/ 2>&1 | tail -1
$AB --session alice wait 3500 2>&1 | tail -1

echo "########## 1) Cloud Gaming via sidebar ref ##########"
$AB --session alice snapshot -i 2>&1 | grep -iE "Cloud Gaming|Chat|Browser|Profile" | head -8
# Click the sidebar "Cloud Gaming" nav button by its label text within the nav
$AB --session alice find role button click --name "Cloud Gaming" 2>&1 | tail -1
$AB --session alice wait 1500 2>&1 | tail -1
echo "--- cloud gaming panel snapshot ---"
$AB --session alice snapshot -i 2>&1 | head -20
echo "--- full text (game cards?) ---"
$AB --session alice snapshot 2>&1 | grep -iE "Neon Snake|2048|Breakout|Tetris|Play instantly" | head -8

echo ""
echo "########## 2) Launch Neon Snake game ##########"
$AB --session alice find text "Neon Snake" click 2>&1 | tail -1
$AB --session alice wait 3000 2>&1 | tail -1
echo "--- after launch: look for iframe + game header ---"
$AB --session alice snapshot -i 2>&1 | head -15
$AB --session alice eval "document.querySelector('iframe') ? document.querySelector('iframe').src : 'NO IFRAME'" 2>&1 | tail -3

echo ""
echo "########## 3) Back to library, then Settings -> owner verify (by ref) ##########"
$AB --session alice find text "Library" click 2>&1 | tail -1
$AB --session alice wait 800 2>&1 | tail -1
$AB --session alice find role button click --name "Settings" 2>&1 | tail -1
$AB --session alice wait 1200 2>&1 | tail -1
echo "--- settings snapshot (get verify button ref) ---"
$AB --session alice snapshot -i 2>&1 | grep -iE "Owner password|Verify ownership|password" | head -8
# Fill owner password field
$AB --session alice find label "Owner password" fill "Samseunlore+2711" 2>&1 | tail -1
$AB --session alice wait 400 2>&1 | tail -1
echo "--- snapshot to find the now-enabled Verify button ref ---"
$AB --session alice snapshot -i 2>&1 | grep -iE "Verify ownership" | head -5
# Click the Verify button using role+name (button, not heading)
$AB --session alice find role button click --name "Verify ownership" 2>&1 | tail -1
$AB --session alice wait 2500 2>&1 | tail -1
echo "--- after verify: should show 'verified as Owner' ---"
$AB --session alice snapshot 2>&1 | grep -iE "verified as Owner|Owner|Crown" | head -8
echo "--- toast/console ---"
$AB --session alice console 2>&1 | tail -5

echo ""
echo "########## 4) Browser panel ##########"
$AB --session alice find role button click --name "Browser" 2>&1 | tail -1
$AB --session alice wait 1200 2>&1 | tail -1
echo "--- browser snapshot ---"
$AB --session alice snapshot -i 2>&1 | head -15
# Type a URL and go
$AB --session alice find placeholder "Search or enter address" fill "en.wikipedia.org" 2>&1 | tail -1
$AB --session alice find placeholder "Search or enter address" click 2>&1 | tail -1
$AB --session alice press Enter 2>&1 | tail -1
$AB --session alice wait 4000 2>&1 | tail -1
echo "--- after nav: iframe src ---"
$AB --session alice eval "document.querySelector('iframe') ? document.querySelector('iframe').src : 'NO IFRAME'" 2>&1 | tail -3

echo ""
echo "########## 5) Profile panel ##########"
$AB --session alice find role button click --name "Profile" 2>&1 | tail -1
$AB --session alice wait 1200 2>&1 | tail -1
echo "--- profile snapshot ---"
$AB --session alice snapshot -i 2>&1 | head -20

echo ""
echo "########## 6) Errors check ##########"
$AB --session alice errors 2>&1 | tail -10
echo "--- screenshot ---"
$AB --session alice screenshot /home/z/my-project/shot-alice2.png 2>&1 | tail -1

echo ""
echo "[v2] DONE"
