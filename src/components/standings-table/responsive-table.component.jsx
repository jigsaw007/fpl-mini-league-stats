import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../../ThemeProvider';

const Styles = styled.div`
    
    width: 100%;
    display: none;

    @media only screen and (max-width: 780px) {
        display: block;
    }

    .team-and-manager {
        display: flex;
        flex-flow: column;
    }


    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        font-weight: 500;
        line-height:1em;
        height: 30px;
        background-color: ${props => props.theme.darkTheme ? '#0e182a' : 'white'};
        border: 1px solid ${props => props.theme.darkTheme ? '#222f44' : '#ddd'};
        color: ${props => props.theme.darkTheme ? 'white' : '#0e182a'};
    }

    td {
        color: #222629;
        border: 1px solid ${props => props.theme.darkTheme ? '#222f44' : '#ddd'};
        color: ${props => props.theme.darkTheme ? 'white' : '#0e182a'};
    }

    .dark {
        background-color: ${props => props.theme.darkTheme ? '#0e182a' : 'white'};
    }

    .light {
        background-color:  ${props => props.theme.darkTheme ? '#132035' : '#f2f2f2'};
    }

    animation-name: table-animation;
    animation-duration: 1s;
  
    @keyframes table-animation {
        from {opacity: 0.5;}
        to {opacity: 1}
    }
`



function ResponsiveTable({data, pageNumber}) {

    const { darkTheme } = useContext(ThemeContext);

    Styles.defaultProps = {
        theme: {
          darkTheme: darkTheme  }
    }

    return (
        <Styles>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team & Manager</th>
                        <th>GW</th>
                        <th>TOT</th>
                    </tr>
                </thead>
                <tbody>
                {data.map((team, idx) => {
                        return (
                            <tr key={team.entry} className={idx % 2 === 0 ? 'dark' : 'light'}>
                                <td>{((pageNumber - 1) * 10) + idx + 1}</td>
                                <td className='team-and-manager'>
                                    <div>{team.entry_name}</div>
                                    <div>{team.player_name}</div>
                                </td>
                                <td>{team.event_total}</td>
                                <td>{team.total}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </Styles>
    )
}

export default ResponsiveTable;