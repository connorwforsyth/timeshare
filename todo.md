\*\*# To Do

Easily finding a time to connect across timezones is hard. That's why we created find-time, a simple one page application that enables you to quickly find a suitable time to connect with friends across timezones.

Features of this app include:

- [ ] Identifying the users current time based on browser location.
- [ ] Displaying a countdown to when the even is held. I.e. in 2 hrs, in 3 days, 3 days go. in 10 minutes.
- [ ] Everything is stored in url params, so no data is stored on our servers.
- [ ] You can even add a meeting link to the invite, so you can click join the meeting from the event invite.
- [ ] Adding users information is easy, you can add as many users as you like while also including their location / timezone. If your timezone is detected, the app will ask if you are "the person(s)" from that timezone, so the app can be reflected in accordance of you.
- [ ] the app enables users emails to be added.
- [ ] The real problem this app is solving is helping people share links across timezones and find a preferred time. For tough timezones, there's usually a preferred window, i.e. when both people are awake, within the logic of the app, present times as close to between 8am local time to 10pm local time for each participant.

The is is the create event view. Where the the interface starts with the users current time, asks for their name, their name of the event.

It uses a fractional slider to help the user select the desired time. Above the slider is a button to shift the date. The slider then rotates corresponding to the desired date.

The user can click and drag to select the start and end of the time.

The user can then also add other people to the meeting, this adds a row to the fractional slider corresponding to their timezone.

the fractional slider is full width of the page. it should start off with only one partcipant (you), with the option to add a name and it should take in the users timezone.

Can you render a grid that is on a slider that presents date and time values, and based on mouse click and drag, selects a start and end date. using framer motion. render the date bellow the slider.

Timezone should consider the local time of where the user is on the client. \*\*
