# Trivia Titan

Build a modern, highly interactive team-based quiz game website.

The website should feel like a professional live quiz / competition game, with a fun, energetic, creative UI and strong animations. It should be optimized for use on a large screen/projector during a live competition.

1. Overall Game Concept

Create a quiz game where multiple teams compete against each other.

Example:

Team 1

Team 2

Team 3

Team 4

The game has:

Questions

Teams

Scores

Turn-based questions

Stealing/steal-answer mechanism

20-second countdown timer

Speed questions where ALL teams can answer

Sound effects

Celebratory animations

Score updates with animations

The experience should feel similar to a TV game show, not like a normal boring quiz website.

2. Main Game Screen

Create a beautiful full-screen game interface.

Header

Show:

Game title

Current question number

Total questions

Current team's name

Current team score

Teams Scoreboard

Display all teams in a visually attractive scoreboard.

Each team card should contain:

Team name

Team color

Current score

Team icon/avatar

Visual indicator when it is their turn

Example:

TEAM 1 🔵 — 120 points
TEAM 2 🔴 — 90 points
TEAM 3 🟢 — 150 points
TEAM 4 🟡 — 70 points

When a team's score changes:

Animate the score

Use a counting animation

Add a floating +10, +20, etc.

Add a subtle glow/confetti effect

3. Question Display

Questions should appear in a large, beautiful card in the center of the screen.

Example:

┌───────────────────────────────────┐
│ │
│ Which planet is known as │
│ the Red Planet? │
│ │
│ A. Earth B. Mars │
│ C. Venus D. Jupiter │
│ │
└───────────────────────────────────┘

Make the question visually engaging.

Use:

Smooth entrance animation

Scale/fade animation

Modern typography

Large answer buttons

Hover effects

Click animations

Do NOT make it look like a generic Bootstrap form.

4. 20-Second Timer

Every normal question should have a 20-second countdown timer.

Display the timer prominently.

Example:

20 → 19 → 18 → ... → 3 → 2 → 1 → TIME'S UP!

The timer should:

Animate smoothly

Change visual state as time decreases

Become more urgent during the last 5 seconds

Pulse during the final seconds

When the timer reaches zero:

Play a clear time-up sound

Stop accepting answers from the current team

Automatically switch the game into STEAL MODE

Show an animation/message such as:

⏰ TIME'S UP!
Other teams can steal!

Then allow the remaining teams to answer.

5. Normal Question Turn System

For a normal question:

Select the team whose turn it is.

Show:

🔵 TEAM 1'S TURN

Start the 20-second timer.

Only the current team can answer.

If they answer correctly:

Show a big SUCCESS animation

Play a success sound

Add the question's points to their score

Show something like:

+20 POINTS

Animate the score increase.

Move to the next question.

If they answer incorrectly:

Show a WRONG animation.

Play an incorrect-answer sound.

Do NOT immediately reveal the correct answer.

Enter STEAL MODE so other teams can attempt the question.

6. Steal Mode

When the active team:

Runs out of time OR

Answers incorrectly

enable Steal Mode.

Display:

🚨 STEAL MODE

and:

Other teams can answer!

The original team should no longer be able to answer.

Display all remaining teams as clickable buttons/cards.

Example:

STEAL THE QUESTION

[ TEAM 2 🔴 ]
[ TEAM 3 🟢 ]
[ TEAM 4 🟡 ]

When another team selects the question:

Highlight that team

Start a short timer (configurable, default 10 seconds)

Allow that team to answer

If correct:

Give them the configured steal points

Show success animation

Update scoreboard

Continue to next question

If wrong:

Show wrong animation

Remove/disable that team from stealing this question

Allow the remaining teams to attempt it

If nobody gets it:

Reveal the correct answer

Continue to the next question

Make this process very clear visually.

7. Speed Questions / All Teams Mode

Add a special question type called:

⚡ SPEED QUESTION

These questions are NOT assigned to a specific team.

When a Speed Question starts:

Display:

⚡ SPEED ROUND!
FIRST TEAM TO ANSWER WINS!

All teams should be able to compete simultaneously.

Show all teams as active participants.

Example:

[ 🔵 TEAM 1 ]
[ 🔴 TEAM 2 ]
[ 🟢 TEAM 3 ]
[ 🟡 TEAM 4 ]

Start a configurable timer, default:

10 seconds

The first team to successfully answer wins the points.

Important:

The UI should visually communicate that ALL teams are allowed to answer.

If the system is being used on one shared screen, provide a clear mechanism for selecting which team buzzed/answered first.

For example:

Team buttons

Large buzz buttons

Keyboard shortcuts

Optional keyboard support

When a team claims the speed question:

🔴 TEAM 2 BUZZED IN!

Then lock the other teams temporarily while Team 2 answers.

If correct:

Award points

Show celebration

Continue

If incorrect:

Remove that team from the current speed question

Allow remaining teams to compete

8. Question Types

Support at least these question types:

Normal Question

Only the assigned team answers.

Steal Question

If the assigned team fails, other teams can answer.

Speed Question

All teams can compete for the answer.

The admin should be able to select the question type when creating a question.

9. Question Management / Admin Panel

Create an admin dashboard where I can manage the game.

I should be able to:

Teams

Add team

Edit team

Delete team

Set team name

Set team color

Set team icon/avatar

Set starting score

Questions

Add question

Edit question

Delete question

Duplicate question

Reorder questions

Set question points

Set question type:

Normal

Steal

Speed

Add multiple-choice answers

Mark the correct answer

Add optional explanation

Add optional image

Add optional sound

Set timer duration

Set steal timer

Set speed-question timer

Allow the admin to preview the question before saving it.

10. Game Setup Screen

Before starting a game, show a setup screen.

Admin can configure:

Game title

Number of teams

Team names

Team colors

Number of questions

Default question timer

Steal timer

Speed question timer

Points per question

Steal points

Speed question points

Sound effects ON/OFF

Animations ON/OFF

Then:

START GAME

11. Game Controls

Add an admin/control panel that can be opened during the game.

Controls:

Next Question

Previous Question

Pause Game

Resume Game

Restart Question

Skip Question

Reveal Answer

Add Points

Remove Points

Reset Scores

End Game

Add keyboard shortcuts where useful.

For example:

Space = Pause/Resume
N = Next Question
R = Restart Question
A = Reveal Answer
1 / 2 / 3 / 4 = Select Team

12. Correct Answer Animation

When a team answers correctly, make the experience exciting.

Show:

🎉 CORRECT!

Then:

+20 POINTS

Use:

Confetti

Particle effects

Score animation

Team card glow

Large animated checkmark

Smooth transitions

Optional celebration sound

Make this animation feel premium and energetic.

13. Wrong Answer Animation

When an answer is wrong:

Show:

❌ WRONG ANSWER

Use:

Shake animation

Red visual feedback

Wrong-answer sound

Then automatically transition into:

🚨 STEAL MODE

Do not make the transition feel abrupt.

14. Time-Up Animation

When the timer reaches zero:

Show a dramatic animation:

⏰ TIME'S UP!

Use:

Screen pulse

Timer shake

Sound effect

Short transition

Then:

🚨 STEAL MODE ACTIVATED

15. Game End Screen

After the final question, show a professional winner screen.

Example:

🏆 GAME OVER

🥇 TEAM 3
150 POINTS

🥈 TEAM 1
130 POINTS

🥉 TEAM 2
110 POINTS

Use:

Confetti

Winner animation

Podium

Animated scores

Celebration sound

Highlight the winning team.

Also include:

PLAY AGAIN

and

BACK TO DASHBOARD

16. UI / Design Direction

The design should be:

Modern

Premium

Fun

Colorful

Energetic

Game-show inspired

Highly animated

Avoid:

Generic dashboards

Plain white forms

Basic Bootstrap-looking UI

Excessive text

Boring cards

Use:

Gradients

Glassmorphism where appropriate

Glow effects

Large typography

Smooth transitions

Micro-interactions

Particles/confetti

Animated score counters

Animated timers

Team-specific colors

The application should be fully responsive, but prioritize large-screen / projector / desktop usage.

17. Sound Effects

Implement sound effects for:

Countdown

Last 5 seconds

Time up

Correct answer

Wrong answer

Steal mode

Speed question

Team buzz

Winner celebration

Add a global sound toggle.

Make sure the app gracefully handles browsers that block autoplay until the first user interaction.

18. Game State

Design the game state carefully.

The game should track:

Current question

Current question type

Current team

Teams

Scores

Timer

Game status

Answer status

Teams that already attempted the question

Steal mode status

Speed mode status

Winner

Question history

Prevent invalid actions.

For example:

A team cannot answer after the timer expires.

The original team cannot answer during steal mode.

A team cannot steal the same question twice.

Teams cannot answer a speed question after they have been eliminated from that question.

Score changes should happen only once per successful answer.

19. Persistence

Make sure game configuration and questions can be saved.

Use a clean data structure so the project can later be connected to a backend/database.

If backend integration is needed, structure it in a way that makes it easy to connect to Supabase.

For the initial version, local persistence is acceptable if it allows the game to work reliably.

20. Important UX Requirement

The most important thing is that the game should be easy to operate during a live competition.

The operator should always know:

Whose turn is it?

How much time is left?

Who can answer?

Who already attempted?

What happens next?

Current scores

Correct/wrong status

Do not hide important game-state information.

Create clear visual states for:

YOUR TURN

WAITING

STEAL MODE

SPEED ROUND

TIME'S UP

CORRECT

WRONG

GAME OVER

21. Technical Requirements

Build this as a production-quality web application.

Use:

React

TypeScript

Tailwind CSS

Modern component architecture

Reusable components

Clean state management

Responsive design

CSS animations / Framer Motion where appropriate

Proper timer handling

Audio management

Local persistence

Keep the code modular and maintainable.

Create reusable components such as:

GameBoard

Scoreboard

TeamCard

QuestionCard

AnswerButton

CountdownTimer

StealMode

SpeedQuestion

GameControls

QuestionManager

TeamManager

GameSetup

CorrectAnswerAnimation

WrongAnswerAnimation

TimeUpAnimation

WinnerScreen

22. Demo Data

Do NOT leave the application empty.

Create a complete demo game with:

4 teams:

Team Alpha

Team Bravo

Team Charlie

Team Delta

At least 10 sample questions.

Include a mixture of:

Normal questions

Steal questions

Speed questions

Make the demo immediately playable when the application starts.

23. Final Goal

The final result should feel like a real interactive quiz competition platform that could be used in:

Schools

Churches

Youth competitions

Team-building events

Live trivia nights

Educational competitions

The experience should be exciting enough that when a team answers correctly, everyone watching immediately sees the score increase, animation, confetti, and celebration.

Focus heavily on game feel, animations, transitions, sound effects, clear game states, and smooth live operation.

Build the complete working experience rather than only creating static UI screens.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://e3dady-arena.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c87abbce-b371-4364-b910-e15eadabfa0d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
