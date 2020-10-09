import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Calculation, { getMiniLeagueName } from './calculation';
import MiniLeagueIDInput from './components/ml-id-input/ml-id-input.component';
import Loading from './components/loading/loading.component';
import CustomTable from './components/standings-table/custom-table.component';

const Styles = styled.div`
  display: flex;
  flex-flow: column;
  text-align: center;
  justify-content: center;
  align-items: center;
  padding: 50px;
  position: relative;

  @keyframes title-animation {
    from {opacity: 0.1;}
    to {opacity: 1;}
  }

  .mini-league-input:active:focus {
    outline: none;
  }

  .mini-league-title {
    padding-top: 30px;
    padding-bottom: 30px;
    font-size: 2.5rem;
    font-weight: 500;
    color: #61892F;
    animation-name: title-animation;
    animation-duration: 1s;
  }

  .buttons-div {
    display: flex;
    justify-content: space-between;
    width: 60%;
  }

  .page-btn {
    border: none;
    border-radius: 5px;
    background-color: #61892F;
    color: #222629;
    cursor: pointer;
    outline: none;
    width: 25%;
    height: 40px;
    margin-top: 5px;
    font-size: 1.2rem;
    transition: all 0.5s ease;
  }

  .disabled {
    opacity: 0.3;
    pointer-events: none;
  }
  
`

function App() {

  const [miniLeagueID, setMiniLeagueID] = useState('');
  const [miniLeagueName, setMiniLeagueName] = useState('');
  const [miniLeagueData, setMiniLeagueData] = useState('');

  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [standingsData, setStandingsData] = useState('');
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setIsLoadingName(false);
  }, [miniLeagueName])

  useEffect(() => {
    setIsLoadingData(false);
    setTotalPages(Math.ceil(miniLeagueData.length / 10));
  }, [miniLeagueData])

  useEffect(() => {
    setStandingsData(miniLeagueData.slice((pageNumber - 1) * 10, (pageNumber - 1) * 10 + 10));
  }, [pageNumber, miniLeagueData])

  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingName(true);
    setIsLoadingData(true);
    let name = await getMiniLeagueName(miniLeagueID);
    setMiniLeagueName(name);
    let data = await Calculation(miniLeagueID)
    setMiniLeagueData(data);
  }

  const handleButtonClickNext = () => {
    setPageNumber(prevValue => prevValue + 1);
  }

  const handleButtonClickPrevious = () => {
    setPageNumber(prevValue => prevValue - 1);
  }


  return (
    <Styles>
      <form onSubmit={handleFormSubmit}>
        <MiniLeagueIDInput  value={miniLeagueID} handleChange={handleInputChange}/>
      </form>
      {miniLeagueName ? <div className='mini-league-title'>{miniLeagueName}</div> : null}
      {isLoadingName || isLoadingData ? <Loading /> : (
        standingsData ? (
          <>
            <CustomTable data={standingsData} pageNumber={pageNumber} />
            <div className='buttons-div'>
              <button onClick={handleButtonClickPrevious} className={'page-btn' + (pageNumber === 1 ? ' disabled' : '')}>Previous</button>
              <button onClick={handleButtonClickNext} className={'page-btn' + (pageNumber === totalPages ? ' disabled' : '')}>Next</button>
            </div>
        </>
        ) : null
      )}

    </Styles>
  );
}

export default App;
