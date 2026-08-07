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
  [ "$c" = "200" ] && { echo "[v4] ready ${i}x2s"; break; }
done

AB="agent-browser"
$AB --session alice open http://127.0.0.1:81/ 2>&1 | tail -1
$AB --session alice wait 3500 2>&1 | tail -1

echo "########## 1) Register fresh user (should be MEMBER, not owner) ##########"
$AB --session alice find text "Register" click 2>&1 | tail -1
$AB --session alice wait 400 2>&1 | tail -1
$AB --session alice find label "Username" fill "alice2" 2>&1 | tail -1
$AB --session alice find label "Password" fill "alicepass1" 2>&1 | tail -1
$AB --session alice find text "Create account" click 2>&1 | tail -1
$AB --session alice wait 4000 2>&1 | tail -1
echo "--- after register: should NOT have owner crown ---"
$AB --session alice snapshot 2>&1 | grep -iE "Crown|Owner|alice2|AL AL" | head -5
echo "--- verify role is MEMBER (no crown in top bar) ---"
$AB --session alice eval "document.querySelector('[aria-label]')?.textContent?.includes('Crown') ? 'HAS CROWN' : 'NO CROWN (correct)'" 2>&1 | tail -2

echo ""
echo "########## 2) Verify owner via Settings ##########"
$AB --session alice find role button click --name "Settings" 2>&1 | tail -1
$AB --session alice wait 1200 2>&1 | tail -1
$AB --session alice find label "Owner password" fill "Samseunlore+2711" 2>&1 | tail -1
$AB --session alice wait 400 2>&1 | tail -1
$AB --session alice find role button click --name "Verify ownership" 2>&1 | tail -1
$AB --session alice wait 2500 2>&1 | tail -1
echo "--- after verify: should show 'verified as Owner' ---"
$AB --session alice snapshot 2>&1 | grep -iE "verified as Owner|Owner" | head -5

echo ""
echo "########## 3) Check golden glowing name (CSS class) ##########"
$AB --session alice find role button click --name "Profile" 2>&1 | tail -1
$AB --session alice wait 1200 2>&1 | tail -1
echo "--- check owner-name CSS class applied ---"
$AB --session alice eval "document.querySelector('.owner-name') ? 'GOLDEN GLOW ACTIVE' : 'NO GLOW'" 2>&1 | tail -2
echo "--- check role tag ---"
$AB --session alice eval "document.querySelector('.role-tag-owner') ? 'OWNER TAG ACTIVE' : 'NO TAG'" 2>&1 | tail -2

echo ""
echo "########## 4) Check avatar deco + profile effect (owner-only) ##########"
echo "--- check deco section exists ---"
$AB --session alice snapshot 2>&1 | grep -iE "Owner Decorations|Avatar Decoration|Profile Effect" | head -5

echo ""
echo "########## 5) Synnical browser (black + pink) ##########"
$AB --session alice find role button click --name "Synnical" 2>&1 | tail -1
$AB --session alice wait 1200 2>&1 | tail -1
echo "--- check Synnical branding + black/pink theme ---"
$AB --session alice snapshot 2>&1 | grep -iE "Synnical" | head -3
$AB --session alice eval "document.querySelector('.synnical-bg') ? 'SYNNICAL THEME ACTIVE' : 'NO THEME'" 2>&1 | tail -2
$AB --session alice eval "getComputedStyle(document.querySelector('.synnical-bg')).backgroundColor" 2>&1 | tail -2

echo ""
echo "########## 6) Friends panel ##########"
$AB --session alice find role button click --name "Friends" 2>&1 | tail -1
$AB --session alice wait 1200 2>&1 | tail -1
echo "--- friends panel snapshot ---"
$AB --session alice snapshot -i 2>&1 | head -15

echo ""
echo "########## 7) Owner: user management in settings ##########"
$AB --session alice find role button click --name "Settings" 2>&1 | tail -1
$AB --session alice wait 1200 2>&1 | tail -1
echo "--- should show User Management section ---"
$AB --session alice snapshot 2>&1 | grep -iE "User Management|Assign roles|mute" | head -5

echo ""
echo "########## 8) Errors check ##########"
$AB --session alice errors 2>&1 | tail -10
echo "--- console (last 8) ---"
$AB --session alice console 2>&1 | tail -8

echo ""
echo "########## 9) dev.log tail ##########"
tail -12 /home/z/my-project/dev.log
echo "--- chat-service.log ---"
tail -5 /home/z/my-project/chat-service.log

echo ""
echo "[v4] DONE"
