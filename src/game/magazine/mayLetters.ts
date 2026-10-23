/**
 * The May issue's readers: the letters (the new limit, the Human Pledge's Line, a man who still has his manuals) and the
 * classifieds, where the limit shows in what is for sale and what may no longer be.
 */
import { classifiedsPage } from './classifieds';
import { letter, lettersPage } from './letters';
import { pageNo } from './pages';
import type { Ctx } from './paper';

/** May's letters. */
export function drawMayLetters(ctx: Ctx): void {
  lettersPage(ctx, [
    ...letter('WILL THEY TAKE IT?', 'My grandson says the new law means they will come for our CoCo. He is nine and he is very worried. I told him nobody is coming for anything, but I would like to be sure.', 'Edith W.', 'Akron, OH', 'Nobody is coming. The change limits what may be sold, not what you own. See page ' + pageNo('mayEditorial') + '.'),
    ...letter('THE ORACLE SAYS YES', 'Your ORACLE told my sister YES eleven times running. She now believes she will marry a film star. I would like to know how it decides.', 'Carl B.', 'Wichita, KS', 'It picks one of eight answers at random. LIST it and you will see them all in its DATA. Your sister’s chances are one in eight each time, which is better than most of us.'),
    ...letter('GUESS IN NINE', 'I got GUESS MY NUMBER in nine tries and my father says that is bad. What is good?', 'Lisa T.', 'Elmira, NY', 'Seven. Always guess halfway between the lowest and highest it could still be, and you will never need more.'),
    ...letter('A WHISTLE ON THE LINE', 'I could not sleep and called the Human Pledge’s Line at two in the morning, as their notice says you may. Before anyone spoke there was a whistle and a hiss, like my nephew’s computer when it calls a bulletin board. Then a very kind man. Is the Line answered by a machine?', 'Name withheld', 'Lexington, KY', 'We asked. We are told the Line is answered by people at every hour, and that some of the old exchanges whistle.'),
    ...letter('LIKE THE OLD DAYS, AGAIN', 'Thank you for printing my letter in March. Two polite young people from the Human Pledge came to my door a week later and asked whether I still had manuals from the big systems. I said I did not. I do.', 'Arthur L.', 'Lexington, KY', 'Your letter was printed as you sent it, with your town. We did not give anyone your address.'),
    ...letter('CLEAN HEADS', 'I bought the HEAD CASE kit from your March issue. My tapes load first time now. The voices have not stopped, but they are clearer.', 'Ron V.', 'Boise, ID', 'We have passed this on to the advertiser.'),
    ...letter('THE MAP AGAIN', 'Thank you for the article on mapping. I have mapped my house, my street and my school. My teacher says I must stop.', 'Priya S.', 'Portland, OR'),
    ...letter('TUESDAYS', 'I have been going to the Human Pledge’s meetings since January. I want to say they are kind people and nothing is asked of you. I sleep better. I have put my CoCo in the closet for now, which they did not ask me to do.', 'Joan R.', 'Dayton, OH'),
  ]);
}

/** May's small ads, and the notice under them: the limit has come down. */
export const drawMayClassifieds = (ctx: Ctx): void =>
  classifiedsPage(
    ctx,
    [
      ['FOR SALE', 'Modem, 1200 baud, with cable and manual. Hardly used. Must go before June 1. Make an offer. Erie, PA.'],
      ['WANTED', 'TAPE DUPE NOW, any version, tape or disk. Will pay more than you did. Box 12, Mansfield, OH.'],
      ['USERS GROUP', 'The Tri-County CoCo Club now meets the first Tuesday at the library basement, 7 p.m. The Elks Hall is taken on Tuesdays. All levels welcome.'],
      ['TAPE COPIES', 'Our duplicating service has closed. Thank you to every customer. Tapes sent to us will be returned.'],
      ['FOR SALE', 'CoCo 2, 64K, two joysticks, recorder, a box of tapes. Going to a quiet home. $120. Lexington, KY.'],
      ['PEN PALS', 'Fifteen, likes codes and ciphers. Will write back in any code you like. Kevin R., Akron, OH.'],
      ['FOUND', 'Still unclaimed at the Elks Hall: one blue spiral notebook, numbered notes in pencil. It will be thrown away at the end of the month.'],
      ['HEADS CLEANED', 'Your recorder cleaned and aligned, $6 plus postage. Tapes loaded and listed while you wait, free.'],
      ['QUIET HOUR', 'The Human Pledge meets Tuesdays at the Friends Meeting House, Lexington. Newcomers welcome. Bring nothing.'],
      ['MAPS FOR SALE', 'Hand-drawn maps of the popular adventures, neat and complete. $2 each. Stamped envelope please.'],
      ['WANTED', 'Anyone who remembers the big machines from before the limit. Stories, manuals, anything. Will pay. Box 31, Prospect, KY.'],
      ['TYPING SERVICE', 'Any program from this magazine typed onto your tape and checked with the RAINBOW CHECK. Twenty-five cents a line. Marge T., Gary, IN.'],
      ['SWAP', 'Two disk drives for anything that fits in a shoebox. Gary, IN.'],
      ['GRANDMOTHER SEEKS', 'to learn what her grandson does all day with that machine. Still baking. Elmira, NY.'],
      ['LOST', 'A cassette labelled in pencil, “TWO”, left at the library. Sentimental. Reward. Second notice.'],
    ],
    'Since April 1, notices for modems faster than 300 baud, second disk drives and tape copying programs cannot be accepted, and replies to them will not be forwarded. Notices already paid for will be refunded.',
  );
