# INFINITE POUR

You are the bartender. So is everyone else on shift.

Pixel-art 3D self-serve bar. Beer, wine, vodka, whiskey, Twisted Tea, Cutwater — the list never ends. Same GitHub Pages link + same bar code = same room.

Open `index.html` over http (not `file://`) or use the Pages site after it goes live.

The club plays the local tracks in `audio/club` in a deterministic shuffled order. The active song, playback position, crowd state, and DJ skips are synchronized room-wide; automatic transitions use three-second crossfades and manual DJ skips use short crossfades. Four ceiling-corner speakers face diagonally into the room; music is quietest away from the speakers, gets bassier and rougher nearby, and gains progressively stronger echo and distortion as you get drunk. Drunk vision uses a flashing red-green-blue blurred channel effect with the mouse look anchored while the drunk swerve remains visual. Darker fog, volumetric smoke, strobes, lasers, and colored spotlights shape the club; only the club door controls simulation activity, so opening the bar's exterior door does not resume it; activity continues while the club door is opening or closing and pauses only after it is shut. Crowds yield with light resistance when you walk through them, balcony walkers move between positions, and club guards draw batons when punched. Press `M` to mute page audio. The DJ screen shows a live equalizer whose colors shift with energy. Hold `Tab` to view the online roster.

Police responses are shared across the room: every player sees the active police cars and officers pursuing other players.
