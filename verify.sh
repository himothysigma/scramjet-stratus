#!/usr/bin/env bash
# Full verification — server + chat + agent-browser all in one process lifetime.
set +e
cd /home/z/my-project

pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "chat-service/index" 2>/dev/null
sleep 1
: > dev.log
: > chat-service.log

# 1) Start chat service
(cd /home/z/my-project/mini-services/chat-service && setsid nohup bun run dev > /home/z/my-project/chat-service.log 2>&1 &)
sleep 1
# 2) Start Next.js
setsid nohup ./node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
echo "[verify] waiting for servers..."
for i in $(seq 1 20); do
  sleep 2
  c=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 http://127.0.0.1:3000/ 2>/dev/null)
  if [ "$c" = "200" ]; then echo "[verify] next ready after ${i}x2s"; break; fi
done

AB="agent-browser"

echo ""
echo "########## A) Open app (gateway :81) as alice ##########"
$AB --session alice open http://127.0.0.1:81/ 2>&1 | tail -2
$AB --session alice wait 3000 2>&1 | tail -1
echo "--- auth snapshot ---"
$AB --session alice snapshot -i 2>&1 | head -20

echo ""
echo "########## B) Register alice ##########"
# Switch to register mode (the "Register" toggle button)
$AB --session alice find text "Register" click 2>&1 | tail -1
$AB --session alice wait 400 2>&1 | tail -1
$AB --session alice find label "Username" fill "alice" 2>&1 | tail -1
$AB --session alice find label "Password" fill "alicepass1" 2>&1 | tail -1
$AB --session alice find text "Create account" click 2>&1 | tail -1
$AB --session alice wait 4000 2>&1 | tail -1
echo "--- post-register snapshot ---"
$AB --session alice snapshot -i 2>&1 | head -40

echo ""
echo "########## C) App shell loaded? check title + url ##########"
echo "title: $($AB --session alice get title 2>&1 | tail -1)"
echo "url: $($AB --session alice get url 2>&1 | tail -1)"

echo ""
echo "########## D) Send a chat message as alice ##########"
# Find the message input (placeholder "Message #general")
$AB --session alice snapshot -i 2>&1 | grep -iE "message|textbox|general" | head -10
$AB --session alice find placeholder "Message #general" fill "hello from alice" 2>&1 | tail -1
$AB --session alice wait 500 2>&1 | tail -1
# Press Enter to send
$AB --session alice find placeholder "Message #general" click 2>&1 | tail -1
$AB --session alice press Enter 2>&1 | tail -1
$AB --session alice wait 2000 2>&1 | tail -1
echo "--- chat messages visible ---"
$AB --session alice snapshot 2>&1 | grep -iE "hello from alice|alice" | head -10

echo ""
echo "########## E) Open second session as bob (cross-device test) ##########"
$AB --session bob open http://127.0.0.1:81/ 2>&1 | tail -2
$AB --session bob wait 3000 2>&1 | tail -1
$AB --session bob find text "Register" click 2>&1 | tail -1
$AB --session bob wait 400 2>&1 | tail -1
$AB --session bob find label "Username" fill "bob" 2>&1 | tail -1
$AB --session bob find label "Password" fill "bobpass1" 2>&1 | tail -1
$AB --session bob find text "Create account" click 2>&1 | tail -1
$AB --session bob wait 4000 2>&1 | tail -1
echo "--- bob post-register snapshot (should see alice's message in history) ---"
$AB --session bob snapshot 2>&1 | grep -iE "hello from alice|alice|general" | head -10

echo ""
echo "########## F) Bob sends a message; alice should see it live ##########"
$AB --session bob find placeholder "Message #general" fill "hi from bob" 2>&1 | tail -1
$AB --session bob find placeholder "Message #general" click 2>&1 | tail -1
$AB --session bob press Enter 2>&1 | tail -1
$AB --session alice wait 2500 2>&1 | tail -1
echo "--- alice should now see 'hi from bob' (real-time cross-device) ---"
$AB --session alice snapshot 2>&1 | grep -iE "hi from bob|hello from alice" | head -10

echo ""
echo "########## G) Cloud gaming panel — launch a game ##########"
$AB --session alice find text "Cloud Gaming" click 2>&1 | tail -1
$AB --session alice wait 1500 2>&1 | tail -1
$AB --session alice find text "Neon Snake" click 2>&1 | tail -1
$AB --session alice wait 2500 2>&1 | tail -1
echo "--- after launching snake ---"
$AB --session alice snapshot -i 2>&1 | head -15

echo ""
echo "########## H) Settings — verify owner ##########"
$AB --session alice find text "Settings" click 2>&1 | tail -1
$AB --session alice wait 1500 2>&1 | tail -1
$AB --session alice snapshot -i 2>&1 | head -25
$AB --session alice find label "Owner password" fill "Samseunlore+2711" 2>&1 | tail -1
$AB --session alice find text "Verify ownership" click 2>&1 | tail -1
$AB --session alice wait 2500 2>&1 | tail -1
echo "--- after verify (should show Owner badge) ---"
$AB --session alice snapshot 2>&1 | grep -iE "Owner|verified|Crown" | head -10

echo ""
echo "########## I) Console errors check ##########"
echo "--- alice console (last 20) ---"
$AB --session alice console 2>&1 | tail -20
echo "--- alice page errors ---"
$AB --session alice errors 2>&1 | tail -20

echo ""
echo "########## J) Screenshots ##########"
$AB --session alice screenshot /home/z/my-project/shot-alice.png 2>&1 | tail -1
$AB --session bob screenshot /home/z/my-project/shot-bob.png 2>&1 | tail -1

echo ""
echo "########## K) dev.log tail ##########"
tail -20 /home/z/my-project/dev.log
echo "########## L) chat-service.log tail ##########"
tail -20 /home/z/my-project/chat-service.log

echo ""
echo "[verify] DONE"
