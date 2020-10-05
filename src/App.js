import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import { players } from './players';
import {testingTeams} from './testing';
import { gameweekFixtures } from './gameweekFixtures';

//zameni testingTeams sa miniLeagueTeams

function App() {

  const [miniLeagueID, setMiniLeagueID] = useState('');
  const [points, setPoints] = useState([]);

  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }



  const handleFormSubmit = async (e) => {
    e.preventDefault();
    Calculation(miniLeagueID);
    
  }

  function getPlayersType(picks) {
    let updatedPicks = picks;
    for(let i = 0; i < picks.length; i++) {
      let type = players[(picks[i].element - 1)].element_type;
      let team = players[(picks[i].element - 1)].team;
      if (type === 1) {
        type = 'GKP'
      } else if(type === 2) {
        type = 'DEF'
      } else if(type === 3) {
        type = 'MID'
      } else if (type === 4) {
        type = 'FWD'
      }
      updatedPicks[i]['element_type'] = type;
      updatedPicks[i]['team'] = team;
    }
    
    return updatedPicks;
  }

  function teamAnalyze(picks) {
    let playerPositions = {
      'GKP': 0,
      'DEF': 0,
      'MID': 0,
      'FWD': 0
    }
    for(let i = 0; i < 11; i++) {
      playerPositions[picks[i].element_type] += 1;
    }
    return playerPositions;
  }

  function Calculation(miniLeagueID) {

    axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`)
        .then(league => {
            let miniLeagueData = league;
            let miniLeaguePlayersData = league.data.standings.results.map(team => ({'event_total': team.event_total, 'total_points': team.total, 'entry': team.entry, 'player_name': team.player_name, 'entry_name': team.entry_name}));
            return {miniLeagueData, miniLeaguePlayersData};
        })
        .then(data => {
            let miniLeagueTeams = [];
            data.miniLeaguePlayersData.map(async teamID => {
                const url = `https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${teamID.entry}/event/4/picks/`
                axios.get(url).then(response => {
                    let picks = getPlayersType(response.data.picks);
                    miniLeagueTeams.push({'picks': picks, ...teamID})
                })
                
            })
            return miniLeagueTeams;
        })
        .then(async miniLeagueTeams => {
            let playerPointsData = await axios.get('https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/event/4/live/')
            return {miniLeagueTeams, playerPointsData}
        })
        .then(({miniLeagueTeams, playerPointsData}) => {
            console.log(miniLeagueTeams)
            let testingTeamsPointsArray = [];
            for(let i = 0; i < testingTeams.length; i++) {
                let teamPlayingPositions = teamAnalyze(testingTeams[i].picks);
                let positionsOnBench = {
                  'DEF': 5 - teamPlayingPositions.DEF,
                  'MID': 5 - teamPlayingPositions.MID,
                  'FWD': 3 - teamPlayingPositions.FWD
                }
                let realTeamPlayingPositions = {
                  'GKP': 0,
                  'DEF': 0,
                  'MID': 0,
                  'FWD': 0
                };
                let didNotPlayFieldPlayers = {
                  'DEF': 0,
                  'MID': 0,
                  'FWD': 0
                }
                let didPlayBenchPlayers = {
                  'DEF': 0,
                  'MID': 0,
                  'FWD': 0
                }
                let didNotPlayBenchPlayers = {
                  'DEF': 0,
                  'MID': 0,
                  'FWD': 0
                }
                let playCounter = 0;
                let minimumPlayingPositions = false;
                let didFirstGKPlayed = true;
                let captainPoints = 0;
                let viceCaptainPoints = 0;
                let didCaptainPlay = true;
                let pointsSum = 0;
                let testingTeamsPoints = {};
                let dateNow = new Date();
                for(let j = 0; j < 11; j++) {
                  let playerStats = playerPointsData.data.elements[testingTeams[i].picks[j].element - 1].stats;
                  let playerTeamActivity = testingTeams[i].picks[j];
                  let hisGameStarted = true;
                  let hisGameEnded = false;
                  for(let g = 0; g < 10; g++) {
                    if(playerTeamActivity.team === gameweekFixtures[g].team_a || playerTeamActivity.team === gameweekFixtures[g].team_h) {
                      let kickoffDate = new Date(gameweekFixtures[g].kickoff_time);
                      //checking if his game started
                      if (dateNow < kickoffDate) {
                        hisGameStarted = false;
                        break;
                      }
                      //checking if his game ended
                      kickoffDate.setHours(kickoffDate.getHours() + 2);
                      if(dateNow > kickoffDate) {
                        hisGameEnded = true;
                      }
                    }
                  }
                  if(playerTeamActivity.is_captain) {
                    captainPoints = playerStats.total_points;
                    if(playerStats.minutes <= 0) {
                      didCaptainPlay = false;
                    }
                  } else if(playerTeamActivity.is_vice_captain) {
                    viceCaptainPoints = playerStats.total_points;
                  }
                  //if his game did not start just skip him
                  if(!hisGameStarted) continue;
                  //if his game ended and player did not enter the game
                  if(hisGameEnded && playerStats.minutes <= 0) {
                    if(playerTeamActivity.element_type === 'GKP') {
                      didFirstGKPlayed = false;
                      continue;
                    }
                    didNotPlayFieldPlayers[playerTeamActivity.element_type] += 1
                    continue;   
                  }
                  if(playerStats.minutes > 0 ) {
                    pointsSum += playerStats.total_points;
                    realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                    playCounter++;
                    continue;
                  }    
                }
                //add captain(or vicecaptain) points after the iteration of the first 11 players
                if(didCaptainPlay) {
                  console.log('kapiten je igrao')
                  pointsSum += captainPoints
                } else {
                  console.log('kapiten nije igrao')
                  pointsSum += viceCaptainPoints
                }
                //checking if the first goalkeeper played. if not we are adding reserve goalkeeper points
                if(!didFirstGKPlayed) {
                  //12th element in picks array is the reserve goalkeeper
                  let playerStats = playerPointsData.data.elements[testingTeams[i].picks[11].element - 1].stats;
                  let playerTeamActivity = testingTeams[i].picks[11];
                  pointsSum += playerStats.total_points;
                  realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                  playCounter++;
                }
                //checking if we already have too many players that did not play
                for(let j = 12; j < 15; j++) {
                  let playerStats = playerPointsData.data.elements[testingTeams[i].picks[j].element - 1].stats;
                  let playerTeamActivity = testingTeams[i].picks[j];
                  if(playerStats.minutes <= 0) {
                    didNotPlayBenchPlayers[playerTeamActivity.element_type] += 1
                  } else {
                    didPlayBenchPlayers[playerTeamActivity.element_type] += 1
                  }
                }
                //defence
                if(didNotPlayFieldPlayers['DEF'] + didNotPlayBenchPlayers['DEF'] === 3) {
                  pointsSum += 0;
                  realTeamPlayingPositions['DEF'] += 1;
                  playCounter++;
                  didNotPlayFieldPlayers['DEF'] -= 1;
                } else if(didNotPlayFieldPlayers['DEF'] + didNotPlayBenchPlayers['DEF'] === 4) {
                  pointsSum += 0;
                  realTeamPlayingPositions['DEF'] += 2;
                  playCounter++;
                  didNotPlayFieldPlayers['DEF'] -= 2;
                } else if(didNotPlayFieldPlayers['DEF'] + didNotPlayBenchPlayers['DEF'] === 5) {
                  pointsSum += 0;
                  realTeamPlayingPositions['DEF'] += 3;
                  playCounter++;
                  didNotPlayFieldPlayers['DEF'] -= 3;
                }
                //midfield
                if(didNotPlayFieldPlayers['MID'] + didNotPlayBenchPlayers['MID'] === 4) {
                  pointsSum += 0;
                  realTeamPlayingPositions['MID'] += 1;
                  playCounter++;
                  didNotPlayFieldPlayers['MID'] -= 1;
                } else if(didNotPlayFieldPlayers['MID'] + didNotPlayBenchPlayers['MID'] === 5) {
                  pointsSum += 0;
                  realTeamPlayingPositions['MID'] += 2;
                  playCounter++;
                  didNotPlayFieldPlayers['MID'] -= 2;
                } 
                //forward
                if(didNotPlayFieldPlayers['FWD'] + didNotPlayBenchPlayers['FWD'] === 3) {
                  pointsSum += 0;
                  realTeamPlayingPositions['FWD'] += 1;
                  playCounter++;
                  didNotPlayFieldPlayers['FWD'] -= 1;
                } 
                //looping our 3 field subs
                for(let j = 12; j < 15; j++) {
                  let playerStats = playerPointsData.data.elements[testingTeams[i].picks[j].element - 1].stats;
                  let playerTeamActivity = testingTeams[i].picks[j];
                  if(playerStats.minutes <= 0) continue;
                  if(playCounter === 11) break;
                  if(didNotPlayFieldPlayers.DEF === 0 && didNotPlayFieldPlayers.MID === 0 && didNotPlayFieldPlayers.FWD === 0) break;
                  if(realTeamPlayingPositions.DEF >= 3 && realTeamPlayingPositions.MID >= 2 && realTeamPlayingPositions.FWD >=1) {
                    minimumPlayingPositions = true;
                  }
                  console.log(playCounter)
                  console.log(minimumPlayingPositions)

                  if(minimumPlayingPositions) {
                    console.log('ma ovde obojica')
                    console.log('ovo su im poeni:' + playerStats.total_points)
                    pointsSum += playerStats.total_points;
                    realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                    playCounter++;
                    didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                    positionsOnBench[playerTeamActivity.element_type] -= 1;
                    continue;
                  }


                  if((teamPlayingPositions['DEF'] - didNotPlayFieldPlayers['DEF'] >= 3) && (teamPlayingPositions['MID'] - didNotPlayFieldPlayers['MID'] >= 2) && (teamPlayingPositions['FWD'] - didNotPlayFieldPlayers['FWD'] >= 1)) {
                    pointsSum += playerStats.total_points;
                    realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                    playCounter++;
                    didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                    positionsOnBench[playerTeamActivity.element_type] -= 1;
                    continue;
                  }
                  if(playerTeamActivity.element_type === 'DEF') {
                    if(didNotPlayFieldPlayers['DEF'] > 0) {
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    } else if((realTeamPlayingPositions['MID'] + didPlayBenchPlayers['MID'] >= 2) && didNotPlayFieldPlayers['FWD'] > didPlayBenchPlayers['FWD']) {
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    } else if((realTeamPlayingPositions['FWD'] + didPlayBenchPlayers['FWD'] >= 1) && didNotPlayFieldPlayers['MID'] > didPlayBenchPlayers['MID']) {
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    }
                  } else if(playerTeamActivity.element_type === 'MID') {
                    if(didNotPlayFieldPlayers['MID'] > 0) {
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    } else if((realTeamPlayingPositions['DEF'] + didPlayBenchPlayers['DEF'] >= 3) && didNotPlayFieldPlayers['FWD'] > didPlayBenchPlayers['FWD']) {
                      console.log('tu')
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    } else if((realTeamPlayingPositions['FWD'] + didPlayBenchPlayers['FWD'] >= 1) && didNotPlayFieldPlayers['DEF'] > didPlayBenchPlayers['DEF']) {
                      console.log('ovde bre')
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    } 
                  } else if(playerTeamActivity.element_type === 'FWD') {
                    if(didNotPlayFieldPlayers['FWD'] > 0) {
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    } else if((realTeamPlayingPositions['DEF'] + didPlayBenchPlayers['DEF'] >= 3) && didNotPlayFieldPlayers['MID'] > didPlayBenchPlayers['MID']) {
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    } else if((realTeamPlayingPositions['MID'] + didPlayBenchPlayers['MID'] >= 2) && didNotPlayFieldPlayers['DEF'] > didPlayBenchPlayers['DEF']) {
                      pointsSum += playerStats.total_points;
                      realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                      playCounter++;
                      didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                      positionsOnBench[playerTeamActivity.element_type] -= 1;
                      continue;
                    }
                  }
                }

                testingTeamsPoints['entry'] = testingTeams[i].entry;
                testingTeamsPoints['points'] = pointsSum
                //testingTeamsPoints['points'] = pointsSum + testingTeams[i].total_points - testingTeams[i].event_total;
                testingTeamsPoints['player_name'] = testingTeams[i].player_name; 
                testingTeamsPoints['entry_name'] = testingTeams[i].entry_name; 
                testingTeamsPointsArray.push(testingTeamsPoints)
            }
            setPoints(testingTeamsPointsArray);
        })


}

  return (
    <div className="App">
      Enter your Mini-League ID:
      <form onSubmit={handleFormSubmit}>
        <input value={miniLeagueID} onChange={handleInputChange}/>
      </form>
      {points ? (
        <div>
          {points.map(team => {
            return (
              <div>
                {team.player_name}
                {team.points}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  );
}

export default App;
